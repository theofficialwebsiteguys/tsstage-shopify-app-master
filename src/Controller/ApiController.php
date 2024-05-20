<?php
/**
 *  This file is part of the Times Square Stage Lightning Shopify App package.
 *  (c) Paper Tiger <team@papertiger.com>
 */

namespace App\Controller;

use Exception;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\SessionInterface;

use App\Service\Shopify;
use App\Service\SmartCollection;
use App\Service\Shipping;
use App\Service\AlgoliaIndex;

use Psr\Log\LoggerInterface;

/**
 * @Route("/api", name="api_")
 */
class ApiController extends AbstractController
{
    /**
     * @Route("/", name="index")
     */
    public function index()
    {
        return $this->json([
            'information' => 'Please specify endpoints',
        ]);
    }


    /**
     * @Route("/reset-token", name="reset_token")
     */
    public function resetToken( SessionInterface $session, Request $request )
    {
        $session->clear();
        return $this->redirect( $request->getSchemeAndHttpHost() );
    }


    /**
     * @Route("/products/{page}/{product_title}", name="products", requirements={"product_title"=".+"})
     */
    public function products( SessionInterface $session, Request $request, Shopify $shopify, int $page = 1, string $product_title = '' )
    {   

        $session->set( 'shop', $request->query->get( 'shop' ) );

        try {

            $nextPage   = $request->query->get( 'next_page' ) ?? '';
            $pagination = $shopify->client()->getProductManager()->paginate([
                'limit' => 50,
                'title' => trim( $product_title ),
                'fields' => 'id,vendor,title,handle,image,product_type,tags'
            ]);

            $products = ( ( $nextPage ) ? $pagination->current( $nextPage ) : $pagination->current() );
            $total    = $shopify->client()->getProductManager()->count([
                'title' => trim( $product_title ),
                'fields' => 'id,vendor,title,handle,image,product_type,tags'
            ]);

            return $this->json([
                'products'  => $products,
                'page'      => $page,
                'next_page' => $pagination->getNextPageInfo(),
                'total'     => $total
            ]);

        } catch( Exception $e ) {
            
            return $this->json([
                'products' => [],
                'page'     => $page,
                'next_page' => null,
                'total'    => 0
            ]);
        }
    }


    /**
     * @Route("/products-by-handle/{product_handles}", name="products_by_handle", requirements={"product_handles"=".+"})
     */
    public function productsByHandle( SessionInterface $session, Request $request, Shopify $shopify, string $product_handles = '' )
    {   

        $session->set( 'shop', $request->query->get( 'shop' ) );

        try {

            $product_handles = json_decode( $product_handles );

            if( count( $product_handles ) && is_array( $product_handles ) ) {

                $products = [];

                foreach( $product_handles as $product_handle ) {

                    $params   = [
                        'page'  => 1,
                        'handle' => trim( $product_handle ),
                        'fields' => 'id,vendor,title,handle,image,product_type,tags'
                    ];

                    $product_temp = $shopify->client()->getProductManager()->findAll( $params );
                    $products     = array_merge( $products, $product_temp );

                    sleep( 0.01 );
                }

                return $this->json([
                    'products' => $products,
                    'page'     => 1,
                    'total'    => count( $products )
                ]);
            }

            return $this->json([
                'products' => [],
                'page'     => 1,
                'total'    => 0
            ]);

        } catch( Exception $e ) {

            return $this->json([
                'products' => [],
                'page'     => 1,
                'total'    => 0
            ]);
        }
    }

/**
 * @Route("/product/save/{product_id}", name="save_product", methods={"POST"})
 */
public function saveProduct(SessionInterface $session, Request $request, Shopify $shopify, int $product_id, LoggerInterface $logger)
{
    $session->set('shop', $request->query->get('shop'));

    $metafields_to_update = $request->request->keys();

    if (count($metafields_to_update)) {
        try {
            $product_metafields = $shopify->client()->get('/products/' . $product_id . '/metafields');

            foreach ($metafields_to_update as $metafield_key) {
                $logger->info('Processing metafield', ['key' => $metafield_key]);

                $data = $request->request->get($metafield_key);

                // Check if data is not empty before proceeding
                if ($data === null || $data === '') {
                    $logger->warning('Skipped empty metafield', ['key' => $metafield_key]);
                    continue;
                }

                // Determine the value_type based on the data
                $value_type = 'string';
                if (is_int($data)) {
                    $value_type = 'integer';
                } elseif (is_array($data)) {
                    $value_type = 'json_string';
                    $data = json_encode($data);
                } elseif (strtolower($data) === 'true' || strtolower($data) === 'false') {
                    $value_type = 'boolean';
                    $data = strtolower($data) === 'true' ? true : false;
                }

                $product_metafield = array_filter($product_metafields['metafields'], function ($metafield) use ($metafield_key) {
                    return $metafield['namespace'] == 'global' && $metafield['key'] == $metafield_key;
                });

                $selected_product_metafield = reset($product_metafield);

                try {
                    if (count($product_metafield) && isset($selected_product_metafield['id'])) {
                        $logger->info('Metafield exists', ['id' => $selected_product_metafield['id']]);

                        if ($data === '' && $selected_product_metafield['value'] !== '') {
                            $logger->info('Deleting metafield', ['id' => $selected_product_metafield['id']]);
                            $update = $shopify->client()->delete('/metafields/' . $selected_product_metafield['id']);
                            $logger->info('Shopify delete response', ['response' => $update]);
                        } else {
                            $logger->info('Updating metafield', ['id' => $selected_product_metafield['id'], 'value' => $data]);
                            $update = $shopify->client()->put('/metafields/' . $selected_product_metafield['id'], [
                                'metafield' => [
                                    'id'    => $selected_product_metafield['id'],
                                    'value' => $data,
                                    'type' => $value_type
                                ]
                            ]);
                            $logger->info('Shopify update response', ['response' => $update]);
                        }
                    } else {
                        $logger->info('Creating new metafield', ['key' => $metafield_key, 'value' => $data]);
                        $response = $shopify->client()->post('/products/' . $product_id . '/metafields', [
                            'metafield' => [
                                'key'        => $metafield_key,
                                'value'      => $data,
                                'type' => $value_type,
                                'namespace'  => 'global'
                            ]
                        ]);
                        $logger->info('Shopify create response', ['response' => $response]);
                    }
                } catch (\Slince\Shopify\Exception\ClientException $e) {
                    $logger->error('Shopify API error', ['exception' => $e->getMessage()]);
                } catch (Exception $e) {
                    $logger->error('General error', ['exception' => $e->getMessage()]);
                }
            }

            return $this->json([
                'success' => 'Update success!'
            ]);
        } catch (Exception $e) {
            $logger->error('Failed to fetch product metafields', ['exception' => $e->getMessage()]);
            return $this->json([
                'error' => 'Failed to fetch product metafields!'
            ]);
        }
    } else {
        return $this->json([
            'error' => 'Nothing to save!'
        ]);
    }
}



    // /**
    //  * @Route("/product/save/{product_id}", name="save_product", methods={"POST"})
    //  */
    // public function saveProduct( SessionInterface $session, Request $request, Shopify $shopify, int $product_id, LoggerInterface $logger )
    // {

    //     $session->set( 'shop', $request->query->get( 'shop' ) );

    //     $metafields_to_update = $request->request->keys();

    //     if( count( $metafields_to_update ) ) {

            

    //         $product_metafields = $shopify->client()->get( '/products/' . $product_id . '/metafields' );

    //         foreach( $metafields_to_update as $metafield_key ) {
    //             $logger->info('HERE I AM PART 1'); 
    //             $data = $request->request->get( $metafield_key );

    //             $product_metafield  = array_filter( $product_metafields[ 'metafields' ], function( $metafield ) use( $metafield_key ) {
    //                 return $metafield[ 'namespace' ] == 'global' && $metafield[ 'key' ] == $metafield_key;
    //             });

    //             $selected_product_metafield = reset( $product_metafield );

    //             if( count( $product_metafield ) && $selected_product_metafield[ 'id' ] ) {
    //                 $logger->info('HERE I AM part 2'); 
    //                  // Update existing metafield
    //                 try {

    //                     // Delete if empty, since Shopify can't allow blank value
    //                     if( $data == '' && $selected_product_metafield[ 'value' ] != '' ) {
    //                         $logger->info('HERE I AM PART 3'); 
    //                         $update = $shopify->client()->delete( '/metafields/' . $selected_product_metafield[ 'id' ] );

    //                         // Log the Shopify response
    //                     $logger->info('shopify', ['responseUpdate' => $update]);  

    //                     } else {
    //                         $logger->info('HERE I AM PART 4'); 
    //                         $update = $shopify->client()->put( '/metafields/' . $selected_product_metafield[ 'id' ], [
    //                             'metafield' => [
    //                                 'id'    => $selected_product_metafield[ 'id' ],
    //                                 'value' => $data
    //                             ]
    //                         ]);

    //                         $logger->info('shopify', ['responseUpdate' => $update]);
    //                     }

    //                 } catch( Exception $e ) {}

    //             } else {
    //                 $logger->info('HERE I AM PART 5'); 
    //                 // Save new metafield
    //                 try {

                       

    //                     // $shopify->client()->post( '/products/' . $product_id . '/metafields', [
    //                     //     'metafield' => [ 
    //                     //         'key'        => $metafield_key,
    //                     //         'value'      => $data,
    //                     //         'value_type' => 'string',
    //                     //         'namespace'  => 'global'
    //                     //     ]
    //                     // ]);

    //                     $shopify->client()->post('/products/' . $product_id . '/metafields', [
    //                         'metafield' => [
    //                             'key'        => $metafield_key,
    //                             'value'      => $data,
    //                             'value_type' => 'string',
    //                             'namespace'  => 'global'
    //                         ]
    //                     ]);
                        
    //                     // Log the Shopify response
    //                     $logger->info('shopify', ['response' => $shopify]);
                        

    //                 } catch( Exception $e ) {
    //                     $logger->info('HERE I AM PART 6');
    //                     $logger->info($e); 
    //                 }
    //             }
    //         }

    //         return $this->json([
    //             'success' => 'Update success!'
    //         ]);

    //     } else {
    //         return $this->json([
    //             'error' => 'Nothing to save!'
    //         ]);
    //     }

    //     return $this->json([
    //         'error' => 'Failed to save!'
    //     ]);
    // }


    /**
     * @Route("/product/{product_id}", name="product")
     */
    public function product( SessionInterface $session, Request $request, Shopify $shopify, int $product_id, LoggerInterface $logger )
    {
        $logger->info('HERE Iam');
        $session->set( 'shop', $request->query->get( 'shop' ) );

        try {

            $product = $shopify->client()->getProductManager()->find( $product_id );
            $product_metafields = $shopify->client()->get( '/products/' . $product_id . '/metafields' );

            return $this->json([
                'product'    => $product,
                'metafields' => $product_metafields[ 'metafields' ]
            ]);

        } catch( Exception $e ) {
            $logger->info('ERRORRRRR');
            $logger->info($e);
            return $this->json([
                'product' => null,
                'metafields' => null,
            ]);
        }
    }


    /**
     * @Route("/collections/{page}/{collection_title}", name="collections", requirements={"collection_title"=".+"})
     */
    public function collections( SessionInterface $session, Request $request, Shopify $shopify, int $page = 1, string $collection_title = '' )
    {   

        $session->set( 'shop', $request->query->get( 'shop' ) );
        
        $params   = [
            'page'  => $page,
            'title' => trim( $collection_title ),
            'fields' => 'id,title,handle,image,rules,disjunctive'
        ];

        $collections = $shopify->client()->getSmartCollectionManager()->findAll( $params );
        $total       = $shopify->client()->getSmartCollectionManager()->count( $params );

        return $this->json([
            'collections' => $collections,
            'page'        => $page,
            'total'       => $total
        ]);
    }


    /**
     * @Route("/collection/save/{collection_id}", name="save_collection")
     */
    public function saveCollection( SessionInterface $session, Request $request, Shopify $shopify, SmartCollection $smart_collection, int $collection_id )
    {

        $session->set( 'shop', $request->query->get( 'shop' ) );

        try {

            $collection = $shopify->client()->getSmartCollectionManager()->find( $collection_id );

            if( !count( $collection->getRules() ) ) {

                return $this->json([
                    'error'    => 'No conditions set in Shopify! <a href="/admin/collections">Make sure you setup Collection Conditions in Shopify first.</a>'
                ]);
            }

            $collection_metafields      = $shopify->client()->get( '/collections/' . $collection_id . '/metafields' );
            $collection_rules_metafield = array_filter( $collection_metafields[ 'metafields' ], function( $metafield ) {
                return $metafield[ 'namespace' ] == 'global' && $metafield[ 'key' ] == 'collection_rules';
            });

            $rules = $smart_collection->convertRulesToMetafields( $collection->getRules(), $collection->isDisjunctive() );

            $selected_collection_metafield = reset( $collection_rules_metafield );

            if( count( $collection_rules_metafield ) && $selected_collection_metafield[ 'id' ] ) {
                
                // Update existing metafield
                try {

                    $update = $shopify->client()->put( '/metafields/' . $selected_collection_metafield[ 'id' ], [
                        'metafield' => [
                            'id'    => $selected_collection_metafield[ 'id' ],
                            'value' => $rules
                        ]
                    ]);

                } catch( Exception $e ) {

                    return $this->json([
                        'error' => 'Failed to sync with Algolia'
                    ]);
                }

            } else {
                
                // Save new metafield
                try {

                    $shopify->client()->post( '/collections/' . $collection_id . '/metafields', [
                        'metafield' => [ 
                            'key'        => 'collection_rules',
                            'value'      => $rules,
                            'value_type' => 'string',
                            'namespace'  => 'global'
                        ]
                    ]);
                    
                } catch( Exception $e ) {

                    return $this->json([
                        'error' => 'Failed to sync with Algolia'
                    ]);
                }
            }

            return $this->json([
                'success'    => 'Sync success!'
            ]);

        } catch( Exception $e ) {

            return $this->json([
                'error' => 'Failed to sync with Algolia'
            ]);
        }
    }


    /**
     * @Route("/rates", name="shipping_rates")
     */
    public function shippingRates( SessionInterface $session, Request $request, Shipping $shipping, LoggerInterface $logger )
    {

        $rates = $shipping->getRates( $request, $logger );

        return $this->json([
            'rates' => $rates
        ]);
    }


    /**
     * @Route("/sync-algolia-settings", name="sync_algolia_settings")
     */
    public function syncAlgoliaSettings( SessionInterface $session, Request $request, AlgoliaIndex $algolia_index, LoggerInterface $logger )
    {
        try{
            $logger->info(print_r($algolia_index, true));
            return $this->json( $algolia_index->sync() );
        }catch( Exception $e ) {
            $logger->info($e);
        }
    }
}
