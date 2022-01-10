/**
 * @file
 * Provides behaviors for Carousel.
 */

/**
 * @typedef CarouselSettings
 * @type {object}
 * @property {string} autoplay - Is autoplay is enabled.
 * @property {string} autoplayDelay - Delay of the autoplay in seconds.
 * @property {string} containerClass - Class of a container.
 * @property {string} enabled - Is swiper carousel enabled.
 * @property {string} itemClass - Slide item class.
 * @property {string} navigation - Is navigation enabled.
 * @property {string} scrollbar - Is scrollbar enabled.
 * @property {string} slidesLarge - Number of slides displayed on large
 *   breakpoint.
 * @property {string} slidesMedium - Number of slides displayed on medium
 *   breakpoint.
 * @property {string} slidesMinimum - Minimum number of slides for carousel to
 *   init.
 * @property {string} slidesSmall - Number of slides displayed on small
 *   breakpoint.
 * @property {string} wrapperClass - Class of the wrapper.
 */

(function ($, Drupal, drupalSettings) {

  'use strict';

  function HereCarousel($element, settings) {

    /**
     * Object reference copy.
     *
     * @type {HereCarousel}
     */
    var hereCarousel = this;

    /**
     * Container of the carousel.
     *
     * @type {jQuery}
     */
    this.$container = $element;

    this.$thumbs = this.$container.parent().parent().find('.carousel-panel--thumb');

    /**
     * Swiper library object.
     *
     * @type {Swiper}
     */
    this.swiper = Swiper;

    /**
     * Checks if slideChange started.
     *
     * @type {boolean}
     */
    this.slideEventStarted = false;

    /**
     * Initialisation flag.
     *
     * @type {boolean}
     */
    this.initialised = false;

    /**
     * Default settings.
     */
    this.defaultSettings = {
      classes: {
        container: settings.containerClass.substr(1) + '-trigger',
        wrapper: settings.wrapperClass.substr(1),
        item: settings.itemClass.substr(1),
        swiperContainer: 'swiper-container',
        swiperWrapper: 'swiper-wrapper',
        swiperItem: 'swiper-slide',
        swiperBullet: 'swiper-pagination-bullet',
        swiperBulletActive: 'swiper-pagination-bullet-active',
        customs: {
          swiperControlsWrapper: 'swiper-controls-wrapper',
          swiperBulletAnimate: 'animated',
          swiperBulletComplete: 'completed',
          swiperBulletAutoplayStop: 'stopped',
          swiperTriggeringSlide: 'swiper-slide-clickable',
        },
      },
    };

    /**
     * Default swiper settings.
     *
     * @type {Object}
     */
    this.swiperSettings = {
      swiper: {
        direction: 'horizontal',
        freeMode: true,
        freeModeSticky: true,
        speed: 700,
        freeModeMomentumRatio: 0.1,
        freeModeMomentumVelocityRatio: 0.1,
        freeModeMomentumBounceRatio: 2,
        freeModeMinimumVelocity: 0.1,
        preventClicks: true,
        preventClicksPropagation: true,
        slidesPerView: 1,
        scrollContainer: true,
        mousewheelControl: true,
        breakpointsInverse: true,
        customs: {
          paginationAdditionalDelay: 700,
          paginationOpacityFadeLength: 700,
        },
        on: {
          init: function () {
            $.when(hereCarousel.$thumbs.stop().animate({ opacity: 0 }, 350, function () {
              $(this).css('display', 'none');
            }))
              .done(function () {
                hereCarousel.$thumbs.eq(hereCarousel.swiper.realIndex).css('display', 'block').stop().animate({ opacity: 1 }, 350);
              });

            hereCarousel.calculateThumbsHeight();
            $(window).on('resize', function () {
              hereCarousel.calculateThumbsHeight();
            });
          },
          slideChange: function () {
            hereCarousel.$container.find('.cta-video-button.cta-video--inline.state-playing').trigger('pauseVideo');
          },
          slideChangeTransitionStart: function () {
            $.when(hereCarousel.$thumbs.stop().animate({ opacity: 0 }, 350, function () {
              $(this).css('display', 'none');
            }))
              .done(function () {
                hereCarousel.$thumbs.eq(hereCarousel.swiper.realIndex).css('display', 'block');
                hereCarousel.$thumbs.eq(hereCarousel.swiper.realIndex).stop().animate({ opacity: 1 }, 350);
              });
          },
          touchMove: function () {
            hereCarousel.slideEventStarted = true;
          },
          touchEnd: function () {
            hereCarousel.slideEventStarted = false;
          },
          transitionEnd: function () {
            if (hereCarousel.swiper && hereCarousel.swiper.autoplay && hereCarousel.swiper.loopFix) {
              hereCarousel.swiper.loopFix();
            }
          },
          paginationRender: function () {
            hereCarousel.$container.find('.' + hereCarousel.defaultSettings.classes.swiperBullet + ' .fill')
              .css('transition-duration', hereCarousel.getTransitionDurationString());
          },
        },
      },
    };

    /**
     * Settings.
     *
     * @type {jQuery}
     */
    this.settings = $.extend(true, this.defaultSettings, this.swiperSettings, settings || {});

    /**
     * Initial function calls.
     */
    this.init();
  }

  /**
   * Init function.
   *
   * Applies swiper classes to the container, wrapper and items.
   * Initialises Swiper on the prepared container.
   */
  HereCarousel.prototype.init = function () {
    if (this.initialised) {
      return;
    }

    var $items = this.$container.find('.' + this.settings.classes.item);
    var isThumbnail = $items.hasClass('carousel-panel--thumb');
    if ($items.length < this.settings.swiper.customs.minimalItemCount || isThumbnail) {
      return;
    }

    this.applyClasses($items);
    this.applySwiper();
    this.constrolsVisibility();
    this.bindVideoPlayActions();
    this.bindResizeEvent();
    this.bindScrollResetEvent();
    this.bindForceSlideChange();
    this.initialised = true;
  };

  /**
   * Binds video play actions to stop carousel autoplay.
   */
  HereCarousel.prototype.bindVideoPlayActions = function () {
    var self = this;

    this.$container.find('.cta').click(function () {
      if (self.swiper.autoplay.running) {
        self.swiper.autoplay.stop();
      }
    });
  };

  /**
   * Reinitialise swiper on resize to recalculate widths.
   */
  HereCarousel.prototype.bindResizeEvent = function () {
    var self = this;
    $(window).on('resize', function () {
      self.swiper.update();
      self.constrolsVisibility();
    });
  };

  /**
   * Bind scroll reset listener.
   *
   * On trigger, the swiper slides to the first slide.
   */
  HereCarousel.prototype.bindScrollResetEvent = function () {
    var self = this;

    this.$container.on('scroll-reset', function () {
      self.swiper.slideTo(0, 16 * 30); // 16 * 30 = ~30 fps.
    });
  };

  /**
   * Bind force slide change listener.
   */
  HereCarousel.prototype.bindForceSlideChange = function () {
    var self = this;
    this.$container.on('forceSlideChange', function (event, index) {
      self.swiper.slideTo(index);
    });
  };

  /**
   * Hide or display controls.
   */
  HereCarousel.prototype.constrolsVisibility = function () {
    var $swiperScrollbar = this.$container.find('.swiper-scrollbar');
    if ($swiperScrollbar.css('display') === 'none') {
      $swiperScrollbar.parent().hide();
    }
    else {
      $swiperScrollbar.parent().show();
    }
  };

  /**
   * Compares height of thumbs attached to main carousel ad gets the biggest
   * height.
   *
   * @return {integer}
   *   The biggest height from thumbs.
   */
  HereCarousel.prototype.calculateThumbsHeight = function () {
    var maxHeight = Math.max.apply(null, this.$thumbs.map(function () {
      return $(this).height();
    }).get());

    this.$thumbs.parent().css('height', maxHeight + 'px');
  };

  /**
   * Apply swiper to a element with swiper-container class.
   */
  HereCarousel.prototype.applySwiper = function () {
    this.swiper = new Swiper(this.$container, this.settings.swiper);
    this.preventAnchorClicks();
    Drupal.attachBehaviors(this.$container.get(0));

    if (this.swiper.autoplay && this.swiper.autoplay.running) {
      this.prepareAutoplay();
      this.bindAutoplay();
    }

    if (this.settings.swiper.customs.slideTriggering === '1') {
      this.bindSlideChangeTrigger();
    }
  };

  /**
   * Prevent accidental clicks on swiper.
   */
  HereCarousel.prototype.preventAnchorClicks = function () {
    var self = this;

    $('.' + this.settings.classes.swiperContainer + ' a').click(function (event) {
      if (self.slideEventStarted) {
        event.preventDefault();
        self.slideEventStarted = false;
      }
    });
  };

  /**
   * Prepares autoplay swiper to animate correctly.
   */
  HereCarousel.prototype.prepareAutoplay = function () {
    var self = this;

    // Stop autoplay and prepare it, then start it again.
    this.swiper.autoplay.stop();
    setTimeout(function () {
      self.addAnimationToBullet(self.swiper.realIndex);

      setTimeout(function () {
        self.swiper.autoplay.start();
      }, self.swiperSettings.swiper.customs.paginationAdditionalDelay);
    }, 10); // Why 10? It needed some sort of timeout to work, 10 is low value.
  };

  /**
   * Binds click event on every swiper slide.
   *
   * Clicking on the element with class swiper-slide + (-next/-prev) will cause
   * slide change.
   */
  HereCarousel.prototype.bindSlideChangeTrigger = function () {
    var self = this;

    var $sliders = this.$container.find('.swiper-slide');

    $sliders.addClass(this.defaultSettings.classes.customs.swiperTriggeringSlide);

    $sliders.on('click', function () {
      var $this = $(this);

      if ($this.hasClass('swiper-slide-next')) {
        self.swiper.slideNext();
      }
      else if ($this.hasClass('swiper-slide-prev')) {
        self.swiper.slidePrev();
      }
    });
  };

  /**
   * Binds autoplay events on swiper to handle the animations of bullets.
   */
  HereCarousel.prototype.bindAutoplay = function () {
    var self = this;
    var classes = this.defaultSettings.classes;

    // Autoplay disable event.
    this.swiper.on('autoplayStop', function () {
      self.$container.find('.' + classes.swiperBullet)
        .addClass(classes.customs.swiperBulletAutoplayStop)
        .removeClass(classes.customs.swiperBulletComplete)
        .removeClass(classes.customs.swiperBulletAnimate);
    });

    // Autoplay event.
    this.swiper.on('autoplay', function () {
      var $bullets = self.$container.find('.' + classes.swiperBullet);
      if (self.swiper.realIndex === 0) {
        self.resetBulletsFill($bullets);
      }
      else {
        $bullets.each(function (index) {
          if (index < self.swiper.realIndex) {
            $(this).addClass(classes.customs.swiperBulletComplete);
          }
          else if (index === self.swiper.realIndex) {
            self.addAnimationToBullet(self.swiper.realIndex);
          }
        });
      }
    });
  };

  /**
   * Resets fill on all bullets.
   *
   * @param {jQuery} $bullets
   */
  HereCarousel.prototype.resetBulletsFill = function ($bullets) {
    var self = this;
    var classes = this.defaultSettings.classes;

    $bullets.addClass(classes.customs.swiperBulletComplete)
      .removeClass(classes.customs.swiperBulletAnimate);

    setTimeout(function() {
      $bullets.removeClass(classes.customs.swiperBulletComplete);
      self.addAnimationToBullet(self.swiper.realIndex);
    }, 50); // Why 50? Because it needs to be fast, but 10 was bugged so I went with 50.
  };

  /**
   * Adds a class to a bullet of given index that animates fill.
   *
   * @param {integer} index
   */
  HereCarousel.prototype.addAnimationToBullet = function (index) {
    this.$container.find('.' + this.defaultSettings.classes.swiperBullet)
      .eq(index)
      .addClass(this.defaultSettings.classes.customs.swiperBulletAnimate);
  };

  /**
   * Gets calculated values for transition duration of the pagination item.
   *
   * @returns {string}
   *   Calculated value for the transition-duration property.
   */
  HereCarousel.prototype.getTransitionDurationString = function () {
    return (this.settings.swiper.autoplay.delay + this.swiperSettings.swiper.customs.paginationAdditionalDelay) + 'ms';
  };

  /**
   * Apply classes to elements used in carousel.
   *
   * @param $items
   *  Flexible card items.
   */
  HereCarousel.prototype.applyClasses = function ($items) {
    var self = this;
    var classes = this.settings.classes;

    // Adds initialised class and swiper container class to the container.
    this.$container.addClass(classes.container);
    this.$container.addClass(classes.swiperContainer);

    // Adds swiper wrapper class to the card wrapper.
    this.$container.children('.' + classes.wrapper).each(function () {
      $(this).addClass(classes.swiperWrapper);
    });

    // Adds swiper slide class to the items.
    $items.each(function () {
      $(this).addClass(self.settings.classes.swiperItem);
    });

    // Appends container with swiper pagination.
    this.$container.append('<div class="' + classes.customs.swiperControlsWrapper + '"></div>');
    var $controlsWrapper = this.$container.find('.' + classes.customs.swiperControlsWrapper);

    if (this.settings.swiper.scrollbar) {
      $controlsWrapper.append('<div class=\"' + this.settings.swiper.scrollbar.el.substr(1) + '\"></div>');
    }

    if (this.settings.swiper.pagination) {
      $controlsWrapper.append('<div class=\"' + this.settings.swiper.pagination.el.substr(1) + '\"></div>');
    }

    if (this.settings.swiper.navigation) {
      $controlsWrapper.append('<div class=\"' + this.settings.swiper.navigation.prevEl.substr(1) + '\"></div>');
      $controlsWrapper.append('<div class=\"' + this.settings.swiper.navigation.nextEl.substr(1) + '\"></div>');
    }

  };

  /**
   * A jQuery interface.
   *
   * @param settings
   *
   * @returns {jQuery}
   */
  HereCarousel.jQueryInterface = function (settings) {
    return this.each(function () {
      new HereCarousel($(this), settings);
    });
  };

  $.fn.hereCarousel = HereCarousel.jQueryInterface;

  function swiperCarouselSettings(node_id) {
    /** @type {CarouselSettings} */
    var carouselSettings = drupalSettings.carousel[node_id];
    var container = carouselSettings.containerClass;
    var settings = {
      containerClass: container,
      wrapperClass: carouselSettings.wrapperClass,
      itemClass: carouselSettings.itemClass,
      centeredSlides: carouselSettings.centeredSlides,
      swiper: {
        breakpoints: {
          0: {
            spaceBetween: carouselSettings.spaceSmall,
            slidesPerView: carouselSettings.slidesSmall,
          }
        },
        customs: {
          minimalItemCount: carouselSettings.slidesMinimum,
          slideTriggering: carouselSettings.slidesTriggering,
        },
      }
    };

    settings.swiper.breakpoints[Drupal.utility.breakpoints.medium] = {
      spaceBetween: carouselSettings.spaceMedium,
      slidesPerView: carouselSettings.slidesMedium,
    };

    settings.swiper.breakpoints[Drupal.utility.breakpoints.large] = {
      spaceBetween: carouselSettings.spaceLarge,
      slidesPerView: carouselSettings.slidesLarge,
    };

    settings.swiper.breakpoints[Drupal.utility.breakpoints.xl] = {
      spaceBetween: carouselSettings.spaceXLarge,
      slidesPerView: carouselSettings.slidesXLarge,
    };

    if (carouselSettings.scrollbar === '1') {
      settings.swiper.scrollbar = {
        el: '.swiper-scrollbar',
        hide: false,
        draggable: true,
        snapOnRelease: true,
      };
    }

    if (carouselSettings.autoplay === '1') {
      settings.swiper.autoplay = {
        delay: parseInt(carouselSettings.autoplayDelay) * 1000,
      };
      settings.swiper.loop = true;
      settings.swiper.loopAdditionalSlides = 20;
      settings.swiper.pagination = {
        el: '.swiper-pagination',
        type: 'bullets',
        clickable: true,
        renderBullet: function () {
          return '<div class="swiper-pagination-bullet">' +
            '<div class="fill-container">' +
            '<div class="fill"></div>' +
            '</div>' +
            '</div>';
        },
      };

      settings.swiper.scrollbar = false;
    }

    if (carouselSettings.navigation === '1') {
      settings.swiper.navigation = {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      };
    }

    return settings;
  }

  /**
   * Swiper carousel behavior.
   */
  Drupal.behaviors.swiperCarousel = {
    attach: function (context) {
      $('.with-carousel', context).once('swiper-carousel').each(function () {
        var $this = $(this);
        var settings = swiperCarouselSettings($this.data('entity-id'));
        $this.find(settings.containerClass).each(function () {
          $(this).hereCarousel(settings);
        });
      });
    }
  };

})(jQuery, Drupal, drupalSettings);
