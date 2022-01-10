/**
 * @file
 * Page anchoring logic.
 */

(function ($, Drupal) {

  /**
   * Gets fixed target if the element needs it.
   *
   * @param {jQuery} $target
   *   Target element.
   *
   * @returns {jQuery}
   *   Fixed target element.
   */
  function getFixedTarget($target) {
    if ($target.hasClass('flexible-cards-tabs__content--item')) {
      return $target.closest('.flexible-cards-tabs');
    }

    return $target;
  }

  /**
   * Scrolls viewport to the target anchor.
   */
  function scroll_to_anchor() {
    if (window.location.hash) {
      var $body = $('body');
      var $target = $('.anchorable[data-anchor="' + $.escapeSelector(window.location.hash) + '"], ' + window.location.hash);

      if ($target.length > 0) {
        $target = getFixedTarget($target);
        var targetOffset = $target.offset().top;

        if (Drupal.utility.isTabletS() || Drupal.utility.isMobile()) {
          // Target offset has to be calculated relatively to the scroll position.
          // It's caused by noScroll(), as <html> gets minus top property.
          targetOffset = $target.offset().top - $body.offset().top + $(window).scrollTop();
        }

        var bodyPadding = parseInt($body.css('padding-top'));
        var menuHeight = parseInt($('.navigation--main .navigation__bottom').outerHeight());

        // If mobile menu is open close it and then scroll the page.
        var scrollTimeout = 0;
        if ($body.hasClass('mobile-menu')) {
          scrollTimeout = 310;
          Drupal.navigation.closeMobileMenu();
        }
        setTimeout(function () {
          $('html, body').animate({
            scrollTop: targetOffset - bodyPadding - menuHeight,
          }, 1);
        }, scrollTimeout);

        // Open accordion item if this is the target.
        if ($target.hasClass('accordion-item')) {
          open_accordion($target, false);
        }

        if ($target.hasClass('accordion')) {
          open_accordion($target, true);
        }

        if ($target.hasClass('flexible-cards-tabs__content--item')) {
          open_flexible_cards_tab($target);
        }

        if ($target.hasClass('carousel-panel')) {
          swipe_carousel($target);
        }

        play_video($target);
      }
    }
  }

  /**
   * Opens up single accordion item or first accordion item in a module if no active class is present.
   *
   * @param {jQuery} $accordion
   *   Accordion item.
   * @param {boolean} first_item
   *   Flag if only the first item should be opened.
   */
  function open_accordion($accordion, first_item) {
    if (first_item) {
      $accordion.find('.accordion-item:first-child:not(.active) .accordion__heading-wrapper').click();
    }
    else {
      if (!$accordion.hasClass('active')) {
        $accordion.find('.accordion__heading-wrapper').click();
      }
    }
  }

  /**
   * Opens up Flexible Cards tab item.
   *
   * @param {jQuery} $flexible_cards_tab
   *   Flexible Cards tab item.
   */
  function open_flexible_cards_tab($flexible_cards_tab) {
    var $tab = $flexible_cards_tab.closest('.flexible-cards-tabs').find('[data-tab-index="' + $flexible_cards_tab.index() + '"]');

    if ($tab.length !== 0) {
      $tab.click();
    }
  }

  /**
   * Swipe carousel to specific slide.
   *
   * @param {jQuery} $carouselPanel
   *   Carousel panel.
   */
  function swipe_carousel($carouselPanel) {
    // Timeout to let carousel init properly.
    setTimeout(function () {
      var index = $carouselPanel.data('swiper-slide-index');
      $carouselPanel.parents('.swiper-container').trigger('forceSlideChange', [index]);
    }, 1500);
  }

  /**
   * Check if target has a cta and if param is present play the video.
   *
   * @param {jQuery} $target
   */
  function play_video($target) {
    var param = 'play-video';

    // Play video if the "play-video" param is present in URL.
    var url = window.location.href;
    if (url.indexOf('?' + param) !== -1 || url.indexOf('&' + param) !== -1) {
      setTimeout(function () {
        $target.find('.play-video-button, .cta-video-button').click();
      }, 500);
    }
  }

  window.addEventListener('load', scroll_to_anchor);
  window.addEventListener('hashchange', scroll_to_anchor);

  // Scroll to the anchor destination on the second click on the link,
  // when hashchange event isn't triggered.
  Drupal.behaviors.scrollToAnchorOnClick = {
    attach: function (context) {
      $('a', context).on('click', function () {
        if (!window.location.hash) {
          return;
        }

        // Remove the current url part from href in case the target anchor is on the same page.
        var href = $(this).attr('href').replace(window.location.pathname, '');

        if (window.location.hash === href) {
          scroll_to_anchor();
        }
      });
    }
  };

})(jQuery, Drupal);
