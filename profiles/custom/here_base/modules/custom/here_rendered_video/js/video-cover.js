/**
 * @file
 * Behaviors for embed video.
 *
 * HereCoverVideo makes videos filling the full wrapper area.
 * Same as background-position: cover.
 * Works on native and embed videos.
 */

(function ($, Drupal) {

  /**
   * HereCoverVideo 'class'.
   *
   * @param $wrapper
   *   Video wrapper.
   * @param settings
   *   Object with settings to override default with.
   *
   * @constructor
   */
  function HereCoverVideo($wrapper, settings) {
    this.defaultSettings = {
      attributes: {
        aspectRatioDivider: 'aspect-ratio-divider',
      },
      classes: {
        playerWrapper: '.video-player',
        videoWrapper: '.video-player__video',
      }
    };

    /**
     * Settings.
     */
    this.settings = $.extend(true, this.defaultSettings, settings || {});

    this.$wrapper = $wrapper;

    this.aspectRatioDivider = 1;

    this.videoUUID = 0;

    this.init();
  }

  /**
   * Init function.
   */
  HereCoverVideo.prototype.init = function () {
    if (this.$wrapper.data(this.settings.attributes.aspectRatioDivider) !== undefined) {
      this.aspectRatioDivider = this.$wrapper.data(this.settings.attributes.aspectRatioDivider);
      this.cover();
    }
  };

  /**
   * Set video size bases on parent and video aspect ratio.
   */
  HereCoverVideo.prototype.setVideoSize = function () {
    var videoWidth = 100 * this.$wrapper.parent().height() / this.$wrapper.parent().width() / this.aspectRatioDivider;

    $(this.settings.classes.videoWrapper, this.$wrapper).width(videoWidth + '%');
  };

  /**
   * Make video cover the wrapper.
   */
  HereCoverVideo.prototype.cover = function () {
    var self = this;

    if ($(self.settings.classes.videoWrapper, self.$wrapper).length > 0) {
      $(this.settings.classes.playerWrapper, this.$wrapper).wrap('<div class="video-square"></div>');
      self.setVideoSize();

      $(window).resize(function () {
        self.setVideoSize();
      });
    }
    else {
      // Wait until video is placed.
      setTimeout((function () {
        self.cover();
      }), 500);
    }
  };

  /**
   * A jQuery interface.
   *
   * @param settings
   *
   * @returns {HereCoverVideo}
   */
  HereCoverVideo.jQueryInterface = function (settings) {
    return new HereCoverVideo($(this), settings);
  };

  $.fn.hereCoverVideo = HereCoverVideo.jQueryInterface;

  /**
   * Drupal behaviors for coverVideo.
   *
   * @type {{attach: Drupal.behaviors.hereCoverVideo.attach}}
   */
  Drupal.behaviors.hereCoverVideo = {
    attach: function (context, settings) {
      $('.video-wrapper--full, .video-embed-wrapper--full', context).once('here-cover-video').each(function () {
        var settings = {};

        // Embeded videos.
        if ($(this).hasClass('video-embed-wrapper--full')) {
          settings = {
            classes: {
              playerWrapper: '.embed-video-player',
              videoWrapper: '.embed-video-player__video',
            }
          };
        }

        // Vidyard.
        if ($(this).hasClass('video-embed-wrapper--vidyard')) {
          settings = {
            classes: {
              playerWrapper: '.vidyard-player-container',
              videoWrapper: '.vidyard-player-container > div',
            }
          };
        }

        $(this).hereCoverVideo(settings);
      });
    }
  };
})(jQuery, Drupal);
