/**
 * @file
 * Behaviors for embed video.
 *
 * HereViewportEmbedVideo makes VIMEO videos play on viewport hit.
 */

(function ($, Drupal, debounce) {

  /**
   * HereViewportEmbedVideo 'class'.
   *
   * @param $wrapper
   *   Embeded video wrapper.
   * @param settings
   *   Object with settings to override default with.
   *
   * @constructor
   */
  function HereViewportEmbedVideo($wrapper, settings) {
    this.defaultSettings = {};

    /**
     * Settings.
     */
    this.settings = $.extend(true, this.defaultSettings, settings || {});

    /**
     * Video wrapper.
     *
     * @type {jQuery|{}}
     */
    this.$wrapper = $wrapper;

    /**
     * Player element.
     *
     * @type {player}
     */
    this.player = '';

    /**
     * Player offset top.
     *
     * @type {number}
     */
    this.playerOffsetTop = 0;

    /**
     * Player height.
     *
     * @type {number}
     */
    this.playerHeight = 0;

    this.init();
  }

  /**
   * Init function.
   */
  HereViewportEmbedVideo.prototype.init = function () {
    var $iframe = this.$wrapper.find('iframe');
    this.player = new Vimeo.Player($iframe);
    var that = this;

    this.player.ready().then(function () {
      that.pauseVideo();

      setTimeout(function () {
        that.setPlayerOffsetTop();
        that.setPlayerHeight();
        that.playInViewport();
        that.bindResizeEvent();
        that.bindScrollEvent();
      }, 500);
    });

    // Set the buffered data attribute to true when video is able to play.
    this.player.on('progress', function () {
      if ($iframe.data('buffered') == false) {
        $iframe.data('buffered', true);
      }
    });
  };

  /**
   * Get current parameters of the viewport.

   * @returns {{Object.<string, number>}}
   *   Viewport parameters.
   */
  HereViewportEmbedVideo.prototype.getCurrentViewportParams = function () {
    var $window = $(window);

    var viewportTop = $window.scrollTop();
    var viewportHeight = $window.height();
    var viewportBottom = viewportTop + viewportHeight;

    return {
      top: viewportTop,
      bottom: viewportBottom,
      height: viewportHeight,
    };
  };

  /**
   * Set player offset top.
   */
  HereViewportEmbedVideo.prototype.setPlayerOffsetTop = function () {
    this.playerOffsetTop = this.$wrapper.offset().top;
  };

  /**
   * Set player height.
   */
  HereViewportEmbedVideo.prototype.setPlayerHeight = function () {
    this.playerHeight = this.$wrapper.outerHeight();
  };

  /**
   * Play the video.
   */
  HereViewportEmbedVideo.prototype.playVideo = function () {
    this.player.play();
    this.$wrapper.removeClass('paused');
  };

  /**
   * Pause the video.
   */
  HereViewportEmbedVideo.prototype.pauseVideo = function () {
    this.player.pause();
    this.$wrapper.addClass('paused');
  };

  /**
   * Check if video is actually in the viewport.
   *
   * @returns {boolean}
   *   Whether video is in viewport or not.
   */
  HereViewportEmbedVideo.prototype.isInViewport = function () {
    var viewportParams = this.getCurrentViewportParams();

    if (viewportParams.bottom > this.playerOffsetTop && viewportParams.top < this.playerOffsetTop + this.playerHeight) {
      return true;
    }

    return false;
  };

  /**
   * Play video only if it is in viewport.
   */
  HereViewportEmbedVideo.prototype.playInViewport = function () {
    if (this.isInViewport() && this.$wrapper.hasClass('paused')) {
      this.playVideo();
    }

    if (!this.isInViewport() && !this.$wrapper.hasClass('paused')) {
      this.pauseVideo();
    }
  };

  /**
   * Bind scroll behaviour.
   */
  HereViewportEmbedVideo.prototype.bindScrollEvent = function () {
    var that = this;

    $(window).scroll(function () {
      that.playInViewport();
    });
  };

  /**
   * Bind resize behaviour.
   */
  HereViewportEmbedVideo.prototype.bindResizeEvent = function () {
    var that = this;

    $(window).resize(debounce(function () {
      that.setPlayerOffsetTop();
      that.setPlayerHeight();
      that.playInViewport();
    }, 500));
  };

  /**
   * A jQuery interface.
   *
   * @param settings
   *
   * @returns {HereViewportEmbedVideo}
   */
  HereViewportEmbedVideo.jQueryInterface = function (settings) {
    return new HereViewportEmbedVideo($(this), settings);
  };

  $.fn.hereViewportEmbedVideo = HereViewportEmbedVideo.jQueryInterface;

  /**
   * Drupal behaviors for hereViewportEmbedVideo.
   *
   * @type {{attach: Drupal.behaviors.hereViewportEmbedVideo.attach}}
   */
  Drupal.behaviors.hereViewportEmbedVideo = {
    attach: function (context, settings) {
      // Only for VIMEO.
      $('.video-embed-wrapper--vimeo.video-embed-wrapper--background-video', context).once('here-viewport-embed-video').each(function () {
        $(this).hereViewportEmbedVideo();
      });
    }
  };
})(jQuery, Drupal, Drupal.debounce);
