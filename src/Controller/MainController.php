<?php
/**
 *  This file is part of the Times Square Stage Lightning Shopify App package.
 *  (c) Paper Tiger <team@papertiger.com>
 */

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\SessionInterface;
use SleekDB\SleekDB;

use App\Service\Shopify;

use Psr\Log\LoggerInterface;

class MainController extends AbstractController
{
    private $api_key    = 'ae938ec61cf087f529893b1580a1c138';
    private $api_secret = '89bfd471d0d4b0ef8079cf7ff6aa463b';


    

    /**
     * @Route("/")
     */
    public function index( SessionInterface $session, Request $request, LoggerInterface $logger )
    {
        $app_url = $request->getSchemeAndHttpHost();

        if( $request->query->get( 'shop' ) && preg_match( '/\.myshopify\.com$/', $request->query->get( 'shop' ), $output_array ) ) {

            $db_path     = $this->getParameter( 'kernel.project_dir' ) . '/var/db/';
            $database    = SleekDB::store( 'shops', $db_path );
            $check_token = $database->where( 'shop', '=', $request->query->get( 'shop' ) )->fetch();
            
             if( $check_token ) {

                $session->set( 'shop', $request->query->get( 'shop' ) );
                
                return $this->render('index.html.twig', [
                    'controller_name' => 'MainController',
                    'shop'    => $request->query->get( 'shop' ),
                    'api_key' => $this->api_key
                ]);
            }
        }

        // If new install
        if( $request->query->get( 'shop' ) ) {

            $scopes       = 'read_products,write_products,read_product_listings,read_themes,write_themes,read_content,write_content,write_shipping';
            $redirect_url = $app_url . '/process-token';
            $install_url  = 'https:///admin/oauth/authorize?client_id=' . $this->api_key . '&scope=' . $scopes . '&redirect_uri=' . urlencode( $redirect_url );

            // Redirect using Embedded SDK
            return $this->render( 'redirect.html.twig', [
                'api_key'      => $this->api_key,
                'scopes'       => $scopes,
                'redirect_url' => urlencode( $redirect_url ),
                'shop'         => $request->query->get( 'shop' )
            ]);
        }

        // Show install form
        return $this->render( 'install.html.twig', [
            'controller_name' => 'MainController',
        ]);
    }

    /**
     * @Route("/process-token")
     */
    public function processToken( Request $request, Shopify $shopify, LoggerInterface $logger )
    {
        $logger->info('HERE I AM PLEASE LOG THIS OUT');
        $db_path  = $this->getParameter( 'kernel.project_dir' ) . '/var/db/';
        $database = SleekDB::store( 'shops', $db_path );
        $app_url  = $request->getSchemeAndHttpHost();

        // If authorization approved, then setup token
        if( $request->query->get( 'code' ) && $request->query->get( 'hmac' ) && $request->query->get( 'shop' ) ) {
            
            $logger->info('In Request');
            // Validate HMAC
            $hmac   = $request->query->get( 'hmac' );
            
            $params = [
                'code'      => $request->query->get( 'code' ),
                'timestamp' => $request->query->get( 'timestamp' ),
                'shop'      => $request->query->get( 'shop' )
            ];
            $logger->info('paramsBefore', ['paramsBefore' => $params]);
            ksort( $params );
            $logger->info('paramsAfter', ['paramsAfter' => $params]);
            $computed_hmac = hash_hmac( 'sha256', http_build_query( $params ), $this->api_secret );
            $logger->info('hmac', ['hmac' => $hmac]);
            $logger->info('computed' , ['computed' => $computed_hmac]);
            if( hash_equals( $hmac, $hmac ) ) {
                $logger->info('IN HMAC');
                // Get token
                $token_url   = 'https://' . $params[ 'shop' ] . '/admin/oauth/access_token';
                $http_client = HttpClient::create( [ 'http_version' => '2.0' ] );
                $http_call   = $http_client->request( 'POST', $token_url, [
                    'query' => [
                        'client_id'     => $this->api_key,
                        'client_secret' => $this->api_secret,
                        'code'          => $params[ 'code' ]
                    ]
                ]);

                $responses = $http_call->toArray();

                if( $responses[ 'access_token' ] ) {
                    $logger->info('IN Response');
                    // Check if exists
                    $current_shop = $database->where( 'shop', '=', $params[ 'shop' ] )->fetch();

                    if( $current_shop ) {

                        $database->where( 'shop', '=', $params[ 'shop' ] )->update([
                            'shop'  => $params[ 'shop' ],
                            'token' => $responses[ 'access_token' ]
                        ]);

                    } else {

                        $database->insert([
                            'shop'  => $params[ 'shop' ],
                            'token' => $responses[ 'access_token' ]
                        ]);

                    }

                    // Install Carrier Service
                    try {
                        $carrier_services  = $shopify->client()->getCarrierServiceManager()->findAll();
                        $carrier_installed = false;
                        $carrier_tsstage = [
                            'name'              => 'TSStage Shipping',
                            'callback_url'      => 'https://59cf-47-20-166-146.ngrok-free.app/api/rates',
                            'service_discovery' => true
                        ];

                        foreach( $carrier_services as $carrier_service ) {
                            $logger->info('Here I ammmmmmmmmm');

                            $logger->info('carrierService', ['carrierService' => $carrier_service->getCallbackUrl()]);
                            $logger->info('carrierServiceName', ['carrierServiceName' => $carrier_service->getName()]);

                            if( $carrier_service->getCallbackUrl() == $carrier_tsstage[ 'callback_url' ] && $carrier_service->getName() == $carrier_tsstage[ 'name' ] ) {
                                $logger->info('in carrier installed');
                                $carrier_installed = true;
                            }
                        }

                        if( !$carrier_installed ) {

                            try {
                                $logger->info('in the try block for carier services');
                                $new_carrier = $shopify->client()->getCarrierServiceManager()->create( $carrier_tsstage );
                                $logger->info('New carrier service created', [
                                    'id' => $new_carrier->getId(),
                                    'name' => $new_carrier->getName(),
                                    'callback_url' => $new_carrier->getCallbackUrl(),
                                    'service_discovery' => $new_carrier->isServiceDiscovery()
                                ]);
                            } catch( Exception $e ) {
                                $logger->info($e);
                            }
                        }
                    } catch( Exception $e ) {
                        error_log($e->getMessage(), 3, "/var/log/logfile.log");
                    }

                    return $this->redirect( $app_url . '?shop=' . $params[ 'shop' ] );
                }

                return $this->redirect( $app_url );
            }

            return $this->redirect( $app_url );
        }
    }
}
