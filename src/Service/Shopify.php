<?php
/**
 *  This file is part of the Times Square Stage Lightning Shopify App package.
 *  (c) Paper Tiger <team@papertiger.com>
 */

namespace App\Service;

use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpFoundation\Session\SessionInterface;
use Slince\Shopify\PublicAppCredential;
use Slince\Shopify\Client;
use SleekDB\SleekDB;

class Shopify
{
    private $params;
    private $session;

    public function __construct( ParameterBagInterface $params, SessionInterface $session )
    {
        $this->params  = $params;
        $this->session = $session;
    }

    public function client()
    {

        if( !$this->session->get( 'shop' ) || $this->session->get( 'shop' ) == 'undefined' ) {
            $this->session->set( 'shop', 'ts-stage-testing.myshopify.com' );
        }

        $db_path     = $this->params->get( 'kernel.project_dir' ) . '/var/db/';
        $database    = SleekDB::store( 'shops', $db_path );
        $check_token = $database->where( 'shop', '=', $this->session->get( 'shop' ) )->fetch();

        $credential = new PublicAppCredential( $check_token[0][ 'token' ] );

        return new Client( $credential, $check_token[0][ 'shop' ], [
            'metaCacheDir' => $this->params->get( 'kernel.cache_dir' )
        ]);
    }
}
