/**
 * @file
 * Javascript file responsible for replacing low quality images with standard ones.
 */

(function ($, Drupal, drupalSettings) {

  /**
   * Check if display is retina.
   *
   * @return bool
   *   True if display is retina, false otherwise.
   */
  function isRetinaDisplay() {
    if (window.matchMedia) {
      var mq = window.matchMedia("only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen  and (min-device-pixel-ratio: 1.3), only screen and (min-resolution: 1.3dppx)");
      return (mq && mq.matches || (window.devicePixelRatio > 1));
    }

    return false;
  }

  /**
   * Check if user uses IE.
   *
   * @return bool
   *   True if browser is IE.
   */
  function isInternetExplorer() {
    return (navigator.userAgent.indexOf('Trident/7.0;') !== -1 && navigator.userAgent.indexOf('rv:11.0') !== -1);
  }

  /**
   * Returns window width, top and bottom scroll positions.
   *
   * @returns object
   *   Object with information about window.
   */
  function getWindowInfo() {
    var $window = $(window);

    return {
      width: $window.outerWidth(),
      height: $window.height(),
      scroll: $window.scrollTop(),
      scrollBottom: $window.scrollTop() + $window.outerHeight()
    };
  }

  // Main object with lazy load stuff.
  Drupal.lazyload = {
    multiplier: isRetinaDisplay() ? ' 2x' : ' 1x',
    internetExplorer: isInternetExplorer(),
    window: getWindowInfo(),
    breakpoints: drupalSettings.lazyload.breakpoints,
    images: {},
    offset: function () {
      var multiplier = 1.5;

      return this.window.height * multiplier;
    },
    reinit: function () {
      var that = this;
      this.images = {};

      $('picture.lazy-load').each(function () {
        var $picture = $(this);
        var uuid = $picture.data('uuid');
        that.images[uuid] = new ResponsivePicture($picture);
      });
    },
  };

  /**
   * Responsive picture object.
   *
   * @param {jQuery} $picture
   *   Picture tag.
   */
  function ResponsivePicture($picture) {

    /**
     * Picture tag.
     *
     * @type {{jQuery}}
     */
    this.$picture = {};

    /**
     * Picture parent.
     *
     * @type {{jQuery}}
     */
    this.$wrapper = {};

    /**
     * Information if this image is currently in viewport.
     *
     * @type {boolean}
     */
    this.inViewport = false;

    /**
     * Constructor.
     */
    this.init = function () {
      this.$picture = $picture;
      this.$wrapper = $picture.parent();
      this.update();
    };

    /**
     * Check if this image is in viewport.
     *
     * @return {boolean}
     *   True if image is in viewport, false if not.
     */
    this.checkViewport = function () {
      var imageTop = this.$wrapper.offset().top;
      var imageBottom = imageTop + this.$picture.height();
      this.inViewport = (
        imageTop < Drupal.lazyload.window.scrollBottom + Drupal.lazyload.offset() && imageBottom > Drupal.lazyload.window.scroll - Drupal.lazyload.offset()
      );
    };

    /**
     * Set state for the picture wrapper.
     *
     * @param {boolean} loaded
     *   Flag if image should be marked as loaded or not.
     */
    this.setState = function (loaded) {
      if (loaded) {
        this.$wrapper.addClass('loaded');
        this.$wrapper.trigger('HereLazyLoad:loaded');
      }
      else {
        this.$wrapper.removeClass('loaded');
      }
    };

    /**
     * Things that need to be done after image has been loaded.
     *
     * @param {{jQuery}} $source
     *   Source DOM element.
     */
    this.afterLoad = function ($source) {
      // Hide correct SVG.
      var breakpointLabel = $source.data('label');
      this.$wrapper.find('svg.' + breakpointLabel).hide();

      // Replace value of fallback image in picture, special behavior for IE.
      var $fallbackImage = this.$picture.find('img');
      if (Drupal.lazyload.internetExplorer) {
        var src = $source.attr('srcset').split(',');
        $fallbackImage.attr('src', src[0].replace(Drupal.lazyload.multiplier, ''));
      }
      else {
        $fallbackImage.attr('src', $fallbackImage.data('src'));
      }
    };

    /**
     * Load the correct image and replace the source srcset.
     */
    this.loadImage = function () {
      var self = this;
      var $source = self.getSource();

      // Do nothing if image was already swapped for this source or there is no data-srcset.
      var srcset = $source.attr('srcset');
      if (typeof $source.data('srcset') === 'undefined' || srcset.indexOf(Drupal.lazyload.multiplier) !== -1) {
        this.setState(true);
        this.afterLoad($source);
        this.removeFromList();
        return;
      }

      // Do nothing when image is not in viewport.
      this.checkViewport();
      if (!this.inViewport) {
        return;
      }

      // Show placeholder again.
      this.setState(false);

      var dataSrcset = $source.data('srcset').split(',');
      for (var i = 0; i < dataSrcset.length; i++) {
        (function (i) {
          // Use correct source.
          if (dataSrcset[i].indexOf(Drupal.lazyload.multiplier) !== -1) {
            // Append image address.
            var newSrc = dataSrcset[i].replace(Drupal.lazyload.multiplier, '');
            var img = new Image();
            img.onload = function () {
              $source.attr('srcset', dataSrcset[i] + ',' + srcset);
              self.setState(true);
              self.afterLoad($source);
              self.removeFromList();
            };
            img.src = newSrc;
          }
        })(i);
      }
    };

    /**
     * Removes this item from the list of elements still not loaded.
     */
    this.removeFromList = function () {
      delete Drupal.lazyload.images[this.$picture.data('uuid')];
    };

    /**
     * Method for finding correct source tag for current window width.
     *
     * @return {{jQuery}}
     */
    this.getSource = function () {
      var mediaQuery = '';
      var $source = $();
      for (var i = 0; i < Drupal.lazyload.breakpoints.length; i++) {
        if (Drupal.lazyload.window.width >= Drupal.lazyload.breakpoints[i]) {
          mediaQuery = 'all and (min-width: ' + Drupal.lazyload.breakpoints[i] + 'px)';
        }
        else if (Drupal.lazyload.window.width < Drupal.lazyload.breakpoints[i]) {
          mediaQuery = 'all and (max-width: ' + Drupal.lazyload.breakpoints[i] + 'px)';
        }

        $source = this.$wrapper.find('source[media="' + mediaQuery + '"]');

        // If source was found exit loop and return it.
        if ($source.length > 0) {
          break;
        }
      }

      return $source;
    };

    /**
     * Update info about this picture and try to load the image.
     */
    this.update = function () {
      this.loadImage();
    };

    this.init();
  }

  /**
   * Lazy load behavior.
   */
  Drupal.behaviors.lazyLoad = {
    attach: function (context, settings) {
      // Scan context for images.
      $('picture.lazy-load', context).once('lazy-load').each(function () {
        var $picture = $(this);
        var uuid = $picture.data('uuid');
        Drupal.lazyload.images[uuid] = new ResponsivePicture($picture);
      });
    }
  };

  // Update window info and try to load images while scrolling.
  $(window).on('scroll', function () {
    Drupal.lazyload.window = getWindowInfo();
    for (var image in Drupal.lazyload.images) {
      Drupal.lazyload.images[image].update();
    }
  });

  // Recreate object with images on resize.
  var resizeTimer;
  $(window).on('resize', function () {
    resizeTimer = setTimeout(function () {
      Drupal.lazyload.window = getWindowInfo();
      Drupal.lazyload.reinit();
    }, 100);
  });

})(jQuery, Drupal, drupalSettings);
