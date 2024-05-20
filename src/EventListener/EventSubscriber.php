<?php
/**
 *  This file is part of the Times Square Stage Lightning Shopify App package.
 *  (c) Paper Tiger <team@papertiger.com>
 */

namespace App\EventListener;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\HttpKernel\Event\FilterResponseEvent;

/**
 * Subscriber for changing header.
 */
class EventSubscriber implements EventSubscriberInterface {

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents() {

    return [
        KernelEvents::RESPONSE => [
            [ 'onKernelResponse', -10 ]
        ]
    ];
  }

  public function onKernelResponse( FilterResponseEvent $event ) {

    $event->getResponse()->headers->remove( 'X-Frame-Options' );
    $event->getResponse()->headers->remove( 'Content-Security-Policy' );
  }

}
