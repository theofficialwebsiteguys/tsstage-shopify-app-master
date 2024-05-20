<?php
/**
 *  This file is part of the Times Square Stage Lightning Shopify App package.
 *  (c) Paper Tiger <team@papertiger.com>
 */

namespace App\Service;

use Exception;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Algolia\AlgoliaSearch\SearchClient;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

class AlgoliaIndex
{

    private $params;
    private $algolia;
    private $logger;

    private $algolia_id        = 'Q2K319H8NV';
    private $algolia_key       = '2abbd8490ba2a2fa66bbe1b437318125';


    public function __construct( ParameterBagInterface $params )
    {

        $algolia = SearchClient::create( $this->algolia_id, $this->algolia_key );
        $log     = new Logger( 'algoliaindex' );
        $log->pushHandler( new StreamHandler( $params->get( 'kernel.project_dir' ) . '/var/log/algoliaindex.log', Logger::WARNING ) );

        $this->algolia = $algolia;
        $this->logger  = $log;
        $this->params  = $params;
    }


    public function sync()
    {

        $output = [
            'error' => 'Failed to sync with Algolia'
        ];

        try {

            // Prepare all indexes
            $indexes = [
                'shopify_products',
                'shopify_products_recently_ordered_count_desc',
                'shopify_products_price_desc',
                'shopify_products_price_asc',
                'shopify_products_alphabetical_asc',
                'shopify_products_alphabetical_desc',
                'shopify_products_date_asc',
                'shopify_products_date_desc'
            ];

            // Prepare rangking settings
            $rankings = [
                'shopify_products' => false,
                'shopify_products_recently_ordered_count_desc' => false,
                'shopify_products_price_desc' => [ 
                    'desc(price)',
                    'typo',
                    'geo',
                    'words',
                    'filters',
                    'proximity',
                    'attribute',
                    'exact',
                    'custom' 
                ],
                'shopify_products_price_asc' => [ 
                    'asc(price)',
                    'typo',
                    'geo',
                    'words',
                    'filters',
                    'proximity',
                    'attribute',
                    'exact',
                    'custom' 
                ],
                'shopify_products_alphabetical_asc' => [ 
                    'asc(title)',
                    'asc(position)',
                    'typo',
                    'geo',
                    'words',
                    'filters',
                    'proximity',
                    'attribute',
                    'exact',
                    'custom' 
                ],
                'shopify_products_alphabetical_desc' => [ 
                    'desc(title)',
                    'asc(position)',
                    'typo',
                    'geo',
                    'words',
                    'filters',
                    'proximity',
                    'attribute',
                    'exact',
                    'custom'
                ],
                'shopify_products_date_asc' => [ 
                    'asc(created_at)',
                    'asc(position)',
                    'typo',
                    'geo',
                    'words',
                    'filters',
                    'proximity',
                    'attribute',
                    'exact',
                    'custom' 
                ],
                'shopify_products_date_desc' => [ 
                    'desc(created_at)',
                    'asc(position)',
                    'typo',
                    'geo',
                    'words',
                    'filters',
                    'proximity',
                    'attribute',
                    'exact',
                    'custom' 
                ]
            ];

            // Prepare default settings
            $default_settings = [
                'attributesToRetrieve' => [
                    'meta.global.disco_product',
                    'meta.global.status',
                    '_tags',
                    'barcode',
                    'body_html_safe',
                    'collections',
                    'compare_at_price',
                    'created_at',
                    'grams',
                    'handle',
                    'id',
                    'image',
                    'inventory_management',
                    'inventory_management_shopify',
                    'inventory_policy',
                    'inventory_quantity',
                    'meta',
                    'meta.global',
                    'meta.global.lamp_wattage',
                    'meta.global.light_type',
                    'meta.global.sku',
                    'named_tags_names',
                    'option1',
                    'option2',
                    'option3',
                    'option_names',
                    'position',
                    'price',
                    'price_range',
                    'price_ratio',
                    'product_image',
                    'product_type',
                    'published_at',
                    'requires_shipping',
                    'sku',
                    'tags',
                    'taxable',
                    'template_suffix',
                    'title',
                    'updated_at',
                    'variant_title',
                    'variants_count',
                    'variants_max_price',
                    'variants_min_price',
                    'vendor',
                    'weight' 
                ],
                'searchableAttributes' => [
                    'title', 
                    'variant_title', 
                    'sku', 
                    'tags',
                    'meta.global.status'
                ],
                'attributesForFaceting' => [
                    'price_range',
                    'vendor',
                    'product_type',
                    'tags',
                    'options.polar_pattern',
                    'options.track_color',
                    'options.output_options',
                    'options.headset_style',
                    'options.cam_lok_pass_through',
                    'options.color_temperature',
                    'options.main_circuit_breaker',
                    'options.height',
                    'options.color',
                    'options.microphone',
                    'options.drape_color',
                    'options.led_array',
                    'options.lens_barrel',
                    'options.connector_type',
                    'options.bulb_type',
                    'options.gobo_size',
                    'options.finish',
                    'options.bulb_length',
                    'inventory_management',
                    'option_names',
                    'options',
                    'meta.global.allowed_to_quotemode',
                    'meta.global.altmanlensbarrel',
                    'meta.global.anchor_mic',
                    'meta.global.base_color',
                    'meta.global.base_size',
                    'meta.global.base_style',
                    'meta.global.base_type',
                    'meta.global.battery',
                    'meta.global.bulb_length',
                    'meta.global.call_4_price',
                    'meta.global.call_4_quote',
                    'meta.global.call_for_price',
                    'meta.global.cam_lok',
                    'meta.global.child_sku',
                    'meta.global.circuit_breaker',
                    'meta.global.clearance',
                    'meta.global.color',
                    'meta.global.color_tempurature',
                    'meta.global.connector',
                    'meta.global.connectors',
                    'meta.global.cost',
                    'meta.global.cost_tier_price',
                    'meta.global.country_of_manufacture',
                    'meta.global.custom_design',
                    'meta.global.custom_design_from',
                    'meta.global.custom_design_to',
                    'meta.global.custom_layout_update',
                    'meta.global.deal',
                    'meta.global.description',
                    'meta.global.dimmable',
                    'meta.global.dimmerchannel',
                    'meta.global.discount',
                    'meta.global.disco_product',
                    'meta.global.dmxcontrol',
                    'meta.global.drapecolor',
                    'meta.global.drapesize',
                    'meta.global.drape_size',
                    'meta.global.drape_style',
                    'meta.global.etcledlensbarrel',
                    'meta.global.exact_box_height',
                    'meta.global.exact_box_length',
                    'meta.global.exact_box_qty',
                    'meta.global.exact_box_width',
                    'meta.global.featured_product',
                    'meta.global.finish_color',
                    'meta.global.free_prod_ship',
                    'meta.global.free_shipping',
                    'meta.global.free_ship_discount',
                    'meta.global.gallery',
                    'meta.global.gelcolor',
                    'meta.global.gift_message_available',
                    'meta.global.gobosize',
                    'meta.global.gobo_color_style',
                    'meta.global.gobo_style',
                    'meta.global.group_allow_quotemode',
                    'meta.global.group_price',
                    'meta.global.headset_style',
                    'meta.global.height',
                    'meta.global.image',
                    'meta.global.ip_rated',
                    'meta.global.is_featured',
                    'meta.global.is_recurring',
                    'meta.global.lamp_ballast',
                    'meta.global.lamp_base',
                    'meta.global.lamp_beam_angle',
                    'meta.global.lamp_cri',
                    'meta.global.lamp_free_ship',
                    'meta.global.lamp_hours',
                    'meta.global.lamp_lumens',
                    'meta.global.lamp_voltage',
                    'meta.global.lamp_volts',
                    'meta.global.lamp_wattage',
                    'meta.global.lamp_watts',
                    'meta.global.led_array',
                    'meta.global.led_temp',
                    'meta.global.length',
                    'meta.global.lens_barrel',
                    'meta.global.light_type',
                    'meta.global.manufacturer',
                    'meta.global.media_gallery',
                    'meta.global.meta_description',
                    'meta.global.meta_keyword',
                    'meta.global.meta_title',
                    'meta.global.mfr',
                    'meta.global.mic_type',
                    'meta.global.mount_version',
                    'meta.global.msrp',
                    'meta.global.msrp_display_actual_price_type',
                    'meta.global.msrp_enabled',
                    'meta.global.name',
                    'meta.global.naya_call_for_price_enable',
                    'meta.global.naya_call_for_price_text',
                    'meta.global.news_from_date',
                    'meta.global.news_to_date',
                    'meta.global.options_container',
                    'meta.global.outdoor',
                    'meta.global.outputoptions',
                    'meta.global.oversized',
                    'meta.global.page_layout',
                    'meta.global.par_can_led_array',
                    'meta.global.par_can_size',
                    'meta.global.perc',
                    'meta.global.polar_pattern',
                    'meta.global.powercord',
                    'meta.global.price',
                    'meta.global.price_view',
                    'meta.global.product_options',
                    'meta.global.projection_distance',
                    'meta.global.quotemode_conditions',
                    'meta.global.recurring_profile',
                    'meta.global.remove_compare_link',
                    'meta.global.roll_size',
                    'meta.global.rotating_outlet',
                    'meta.global.searchindex_weight',
                    'meta.global.ship_box_tolerance',
                    'meta.global.ship_case_quantity',
                    'meta.global.ship_height',
                    'meta.global.ship_length',
                    'meta.global.ship_possible_boxes',
                    'meta.global.ship_separately',
                    'meta.global.ship_width',
                    'meta.global.shoppingflux_product',
                    'meta.global.short_description',
                    'meta.global.sku',
                    'meta.global.sleevesize',
                    'meta.global.small_image',
                    'meta.global.special_from_date',
                    'meta.global.special_price',
                    'meta.global.special_to_date',
                    'meta.global.split_product',
                    'meta.global.stage_lighting_package_type',
                    'filterOnly(meta.global.status)',
                    'meta.global.tax_class_id',
                    'meta.global.thumbnail',
                    'meta.global.tier_price',
                    'meta.global.top_size',
                    'meta.global.track_color',
                    'meta.global.track_length',
                    'meta.global.track_system',
                    'meta.global.truss_style',
                    'meta.global.truss_type',
                    'meta.global.upc',
                    'meta.global.uprights_length',
                    'meta.global.uprights_size',
                    'meta.global.uprights_type',
                    'meta.global.upright_color',
                    'meta.global.url_key',
                    'meta.global.visibility',
                    'meta.global.web_special',
                    'meta.global.weight',
                    'meta.global.weight_capacity',
                    'meta.global.wireless_control',
                    'meta.global.wireless_dmx',
                    'meta.global.xlr_connector'
                ]
            ];

            // Make sure all index exists
            $not_exists = false;
            foreach( $indexes as $index_name ) {
                
                $index = $this->algolia->initIndex( $index_name );

                if( !$index->exists() ) {
                    $not_exists = true;
                }
            }

            if( $not_exists ) {

                $main_index = $this->algolia->initIndex( 'shopify_products' );
                $main_index->setSettings([
                    'replicas' => [
                        'shopify_products_recently_ordered_count_desc',
                        'shopify_products_price_desc',
                        'shopify_products_price_asc',
                        'shopify_products_alphabetical_asc',
                        'shopify_products_alphabetical_desc',
                        'shopify_products_date_asc',
                        'shopify_products_date_desc'
                    ]
                ]);
            }

            // Set settings for each index
            foreach( $indexes as $index_name ) {
                
                $index = $this->algolia->initIndex( $index_name );

                if( $rankings[ $index_name ] ) {

                    $setting = $default_settings;
                    $setting[ 'ranking' ] = $rankings[ $index_name ];

                    $index->setSettings( $setting );

                } else {
                    $index->setSettings( $default_settings );
                }
            }

            $output = [
                'success' => 'Sync Success!'
            ];

        } catch( Exception $e ) {

            $output = [
                'error' => 'Failed to sync with Algolia, '. $e->getMessage()
            ];
        }

        return $output;
    }
}
