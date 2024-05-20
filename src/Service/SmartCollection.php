<?php
/**
 *  This file is part of the Times Square Stage Lightning Shopify App package.
 *  (c) Paper Tiger <team@papertiger.com>
 */

namespace App\Service;

class SmartCollection
{

    public function convertRulesToMetafields( array $rules, bool $disjunctive )
    {
        $converted_rules = [];

        foreach( $rules as $rule ) {

            if( $rule[ 'column' ] ) {

                if( substr( $rule[ 'condition' ], 0, strlen( 'mw_product_' ) ) != 'mw_product_' ) {
                    switch( $rule[ 'column' ] ) {
                        case 'tag':
                            $column = 'tags';
                        break;
                        case 'type':
                            $column = 'product_type';
                        break;
                        default:
                            $column = $rule[ 'column' ];
                        break;
                    }

                    $converted_rules[] =  $column . ":'" .$rule[ 'condition' ] . "'";
                }
            }
        }

        $converted_rules = implode( '#|#', $converted_rules );
        $converted_rules = ( $disjunctive ? 'OR#|#' : 'AND#|#' ) . $converted_rules;

        return $converted_rules;
    }
}
