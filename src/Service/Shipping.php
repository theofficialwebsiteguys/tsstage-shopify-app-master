<?php
/**
 *  This file is part of the Times Square Stage Lightning Shopify App package.
 *  (c) Paper Tiger <team@papertiger.com>
 */

namespace App\Service;

use Exception;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use pdt256\Shipping\Shipment;
use pdt256\Shipping\Package;
use pdt256\Shipping\UPS;
use pdt256\Shipping\RateRequest;
use Polcode\UnitConverterBundle\Units\Weight;
use Algolia\AlgoliaSearch\SearchClient;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

use Psr\Log\LoggerInterface;

class Shipping
{

    private $params;
    private $algolia;
    private $logger;

    private $user_id           = 'felixsansone';
    private $password          = 'fs046984';
    private $access_key        = 'FD28B9FD2ACC8FB8';
    private $shipper           = '15R501';
    private $algolia_id        = 'Q2K319H8NV';
    private $algolia_key       = '2abbd8490ba2a2fa66bbe1b437318125';

    private $default_width     = 10;
    private $default_height    = 10;
    private $default_length    = 10;

    private $ups_weight_limit  = 150;   // lbs
    private $minimum_cost      = 1500;  // in cents
    private $freeship_over     = 29900; // in cents
    private $additional_cost   = 20;    // 20%


    public function __construct( ParameterBagInterface $params )
    {

        $algolia = SearchClient::create( $this->algolia_id, $this->algolia_key );
        $log     = new Logger( 'shipping' );
        $log->pushHandler( new StreamHandler( $params->get( 'kernel.project_dir' ) . '/var/log/shipping.log', Logger::WARNING ) );

        $this->algolia = $algolia;
        $this->logger  = $log;
        $this->params  = $params;
    }


    private function getShopifyProducts( $filter )
    {
        $index         = $this->algolia->initIndex( 'shopify_products' );
        $raw_products  = $index->search( '', [
            'filters' => $filter,
            'attributesToRetrieve' => [ 
                'id',
                'title'
            ],
            'distinct'    => true,
            'hitsPerPage' => 1000
        ]); 

        $products = [];

        if( $raw_products[ 'hits' ] ) {

            foreach( $raw_products[ 'hits' ] as $raw_product ) {

                if( $raw_product[ 'id' ] && !in_array( $raw_product[ 'id' ], $products ) ) {
                    $products[] = $raw_product[ 'id' ];
                }
            }
        }

        return $products;
    }
    

    private function checkProductExistsInRules( $items, $products )
    {
        $exists = false;

        if( is_array( $items ) ) {

            foreach( $items as $item ) {

                if( in_array( $item[ 'product_id' ], $products ) ) {
                    $exists = true;
                }
            }
        } else {

            if( in_array( $items, $products ) ) {
                $exists = true;
            }
        }

        return $exists;
    }


    private function markupCost( $cost )
    {
        return $cost + ( $cost * ( $this->additional_cost / 100 ) );
    }


    public function getRates( $request, LoggerInterface $logger )
    {

        // Get Shopify Products
        $products_oversized          = $this->getShopifyProducts( 'meta.global.oversized:Yes' );
        $products_freeshipping       = $this->getShopifyProducts( 'meta.global.free_shipping:Yes' );
        $products_freeshipping_over  = $this->getShopifyProducts( 'meta.global.free_ship_discount:Yes' );

        // Read Shopify query
        $shopify_query = json_decode( $request->getContent(), true );

        $logger->info('shopifyquery' , ['shopquery' => $logger->info('In shop query')]);


        // No query from Shopify, return empty
        if( !$shopify_query[ 'rate' ] ) {
            return [];
        }

        // Setup currency
        $currency = 'USD';

        if( $shopify_query[ 'rate' ][ 'currency' ] ) {
            $logger->info('In shop query');
            $currency = $shopify_query[ 'rate' ][ 'currency' ];
        }

        // Count total order
        $total_order = 0;

        foreach( $shopify_query[ 'rate' ][ 'items' ] as $item ) {
            $logger->info('In foreach total');
            $total_order = $total_order + ( $item[ 'price' ] * $item[ 'quantity' ] );
        }

        // Count Weight for common products, don't count weight for free shipping or oversized products
        $weight                   = 0;
        $weight_without_filters   = 0;
        $oversized_exists         = false;
        $freeshipping_exists      = false;
        $common_product_exists    = false;
        $oversized_description    = 'Items marked "Oversized Ships via Truck" DO NOT SHIP FREE & we will contact you with shipping rate.';

        foreach( $shopify_query[ 'rate' ][ 'items' ] as $item ) {

            if( $item[ 'requires_shipping' ] ) {
                $weight_without_filters = $weight_without_filters + ( $item[ 'grams' ] * $item[ 'quantity' ] );
            }

            if( $this->checkProductExistsInRules( $item[ 'product_id' ], $products_oversized ) ) {

                // Oversized
                $oversized_exists = true;

            } elseif( $this->checkProductExistsInRules( $item[ 'product_id' ], $products_freeshipping ) || $this->checkProductExistsInRules( $item[ 'product_id' ], $products_freeshipping_over ) ) {

                // Free Shipping, first check if total order is over $299
                if( $total_order >= $this->freeship_over ) {
                    $freeshipping_exists = true;   
                } else {

                    // Treat as common products
                    if( $item[ 'requires_shipping' ] ) {

                        $common_product_exists = true;
                        $weight = $weight + ( $item[ 'grams' ] * $item[ 'quantity' ] );
                    }
                }

            } else {

                // Common products
                if( $item[ 'requires_shipping' ] ) {

                    $common_product_exists = true;
                    $weight = $weight + ( $item[ 'grams' ] * $item[ 'quantity' ] );
                }
            }
        }

        // Convert from grams to lbs
        $weight_in_lb                 = ( new Weight( $weight, 'g' ) )->toUnit( 'lb' );
        $weight_without_filters_in_lb = ( new Weight( $weight_without_filters, 'g' ) )->toUnit( 'lb' );

        // Prepare rates
        $rates = [];

        // Display rates for Free Shipping and Free Shipping over $299
        if( $freeshipping_exists && !$common_product_exists ) {

            $rates[] = [
               'service_name'      => 'Free Ground Shipping',
               'service_code'      => 'free-ground-shipping',
               'description'       => ( $oversized_exists ? $oversized_description : 'All products in your cart are elligible for free shipping.' ),
               'total_price'       => 0,
               'currency'          => $currency,
               'min_delivery_date' => null,
               'max_delivery_date' => null
            ];
        }

        // Display rates for Oversized
        if( $oversized_exists && !$freeshipping_exists && !$common_product_exists ) {

            $rates[] = [
               'service_name'      => 'Ships via Truck',
               'service_code'      => 'ships-via-truck',
               'description'       => $oversized_description,
               'total_price'       => 0,
               'currency'          => $currency,
               'min_delivery_date' => null,
               'max_delivery_date' => null
            ];
        }


        // Get real-time rates from UPS
        try {

            $ups_rates        = [];
            $ups_ground_rates = [];

            // UPS Ground
            if( $common_product_exists ) {

                $weight_to_use = ( $freeshipping_exists ) ? $weight_in_lb : $weight_without_filters_in_lb;

                $shipment = new Shipment;
                $shipment
                    ->setFromIsResidential( false )
                    ->setFromStateProvinceCode( $shopify_query[ 'rate' ][ 'origin' ][ 'province' ] )
                    ->setFromPostalCode( $shopify_query[ 'rate' ][ 'origin' ][ 'postal_code' ] )
                    ->setFromCountryCode( $shopify_query[ 'rate' ][ 'origin' ][ 'country' ] )
                    ->setToIsResidential( true )
                    ->setToPostalCode( $shopify_query[ 'rate' ][ 'destination' ][ 'postal_code' ] )
                    ->setToCountryCode( $shopify_query[ 'rate' ][ 'destination' ][ 'country' ] );

                if( $weight_to_use <= $this->ups_weight_limit ) {

                    $package = new Package;
                    $package
                        ->setLength( $this->default_length )
                        ->setWidth( $this->default_width )
                        ->setHeight( $this->default_height )
                        ->setWeight( $weight_to_use );

                    $shipment->addPackage( $package );
                
                } else {

                    // Ship multiple packages due to UPS limitation max 150lbs per package
                    do {

                        if( ceil( $weight_to_use / $this->ups_weight_limit ) == 1 ) {
                            $ups_weight = $weight_to_use;
                        } else {
                            $ups_weight = $this->ups_weight_limit;
                        }

                        $package = new Package;
                        $package
                            ->setLength( $this->default_length )
                            ->setWidth( $this->default_width )
                            ->setHeight( $this->default_height )
                            ->setWeight( $ups_weight );

                        $shipment->addPackage( $package );

                        $weight_to_use = $weight_to_use - $this->ups_weight_limit;

                    } while( ceil( $weight_to_use / $this->ups_weight_limit ) >= 1 );
                }

                $ups = new UPS\Rate([
                    'prod'           => true,
                    'accessKey'      => $this->access_key,
                    'userId'         => $this->user_id,
                    'password'       => $this->password,
                    'shipperNumber'  => $this->shipper,
                    'shipment'       => $shipment,
                    'approvedCodes'  => [
                        '03', // UPS Ground
                    ]
                ]);

                $ups_ground_rates = $ups->getRates();
            }

            if( $freeshipping_exists || $common_product_exists ) {
                
                // UPS Next Day Air, UPS 2nd Day Air, UPS 3 Day Select
                // This will use $weight_without_filters_in_lb since Air Ship don't accept Free Shipping
                $shipment = new Shipment;
                $shipment
                    ->setFromIsResidential( false )
                    ->setFromStateProvinceCode( $shopify_query[ 'rate' ][ 'origin' ][ 'province' ] )
                    ->setFromPostalCode( $shopify_query[ 'rate' ][ 'origin' ][ 'postal_code' ] )
                    ->setFromCountryCode( $shopify_query[ 'rate' ][ 'origin' ][ 'country' ] )
                    ->setToIsResidential( true )
                    ->setToPostalCode( $shopify_query[ 'rate' ][ 'destination' ][ 'postal_code' ] )
                    ->setToCountryCode( $shopify_query[ 'rate' ][ 'destination' ][ 'country' ] );

                if( $weight_without_filters_in_lb <= $this->ups_weight_limit ) {

                    $package = new Package;
                    $package
                        ->setLength( $this->default_length )
                        ->setWidth( $this->default_width )
                        ->setHeight( $this->default_height )
                        ->setWeight( $weight_without_filters_in_lb );

                    $shipment->addPackage( $package );
                
                } else {

                    // Ship multiple packages due to UPS limitation max 150lbs per package
                    do {

                        if( ceil( $weight_without_filters_in_lb / $this->ups_weight_limit ) == 1 ) {
                            $ups_weight = $weight_without_filters_in_lb;
                        } else {
                            $ups_weight = $this->ups_weight_limit;
                        }

                        $package = new Package;
                        $package
                            ->setLength( $this->default_length )
                            ->setWidth( $this->default_width )
                            ->setHeight( $this->default_height )
                            ->setWeight( $ups_weight );

                        $shipment->addPackage( $package );

                        $weight_without_filters_in_lb = $weight_without_filters_in_lb - $this->ups_weight_limit;

                    } while( ceil( $weight_without_filters_in_lb / $this->ups_weight_limit ) >= 1 );
                }

                $ups = new UPS\Rate([
                    'prod'           => true,
                    'accessKey'      => $this->access_key,
                    'userId'         => $this->user_id,
                    'password'       => $this->password,
                    'shipperNumber'  => $this->shipper,
                    'shipment'       => $shipment,
                    'approvedCodes'  => [
                        // United States
                        '01', // UPS Next Day Air
                        '02', // UPS 2nd Day Air
                        '12', // UPS 3 Day Select

                        // Worldwide
                        '08', // UPS Worldwide Expedited
                        '11', // UPS Standard
                    ]
                ]);

                $ups_rates = $ups->getRates();
            }

            // Merge two rates
            $live_rates = array_merge( $ups_ground_rates, $ups_rates );

            // Setup rate informations
            $rate_description = [
                // United States
                '01' => '1 business day',
                '02' => '2 business days',
                '03' => '1-5 business days',
                '12' => '3 business days',

                // Worldwide
                '08' => '2-5 business days',
                '11' => '3-7 business days',
            ];

            $rate_delivery = [
                // United States
                '01' => [
                    'min' => 1,
                    'max' => null
                ],
                '02' => [
                    'min' => 2,
                    'max' => null
                ],
                '03' => [
                    'min' => 1,
                    'max' => 5
                ],
                '12' => [
                    'min' => 3,
                    'max' => null
                ],

                // Worldwide
                '08' => [
                    'min' => 2,
                    'max' => 5
                ],
                '11' => [
                    'min' => 3,
                    'max' => 7
                ],
            ];
            
            // Make sure to display flat rate $15 for ship cost lower than $15
            $flat_rate = false;

            foreach( $live_rates as $rate ) {

                if( $rate->getCost() < $this->minimum_cost ) {
                    
                    if( !$flat_rate ) {

                        $flat_rate = true;

                        $rates[] = [
                           'service_name'      => 'Flat Rate Shipping',
                           'service_code'      => 'flat-rate-shipping',
                           'description'       => ( $oversized_exists ? $oversized_description : '' ),
                           'total_price'       => $this->minimum_cost,
                           'currency'          => $currency,
                           'min_delivery_date' => null,
                           'max_delivery_date' => null
                        ];    
                    }

                    continue;
                }

                $rates[] = [
                   'service_name'      => $rate->getName(),
                   'service_code'      => $rate->getCode(),
                   'description'       => ( $oversized_exists ? $oversized_description : $rate_description[ $rate->getCode() ] ),
                   'total_price'       => $this->markupCost( $rate->getCost() ),
                   'currency'          => $currency,
                   'min_delivery_date' => ( $oversized_exists ? ( date( 'Y-m-d H:i:s O', strtotime( '+'. $rate_delivery[ $rate->getCode() ][ 'min' ] .' days' ) ) ) : $rate->getDeliveryEstimate() ),
                   'max_delivery_date' => ( $oversized_exists ? ( date( 'Y-m-d H:i:s O', strtotime( '+'. $rate_delivery[ $rate->getCode() ][ 'max' ] .' days' ) ) ) : $rate->getDeliveryEstimate() )
                ];
            }

        } catch( Exception $e ) {}

        return $rates;
    }
}
