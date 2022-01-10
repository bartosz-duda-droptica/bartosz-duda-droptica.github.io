(function ($, Drupal) {

  'use strict';

  function HereOverlayCtaVideo($playVideoCta, settings) {

    /**
     * Default settings.
     */
    this.defaultSettings = {
      // Classes.
      colorboxWrapperAdditionalClass: 'cta-video__colorbox',
      colorboxContentSelector: '#cboxLoadedContent',
      colorboxCloseSelector: '#cboxClose',
      videoWrapperSelector: '.video-wrapper',
      // Selectors.
      // Selector that should be processed via Vidyard script to place there the video.
      vidyardToBeElementSelector: 'img.vidyard-player-embed',
      youtubeToBeElementSelector: 'div.youtube-embed-player',
      // Others.
      mobileOnly: false,
    };

    /**
     * Settings.
     */
    this.settings = $.extend(true, this.defaultSettings, settings || {});
    this.settings.colorboxWrapperSelector = '#colorbox.' + this.defaultSettings.colorboxWrapperAdditionalClass;

    /**
     * Video play CTA.
     *
     * @type {jQuery|{}}
     */
    this.$playVideoCta = $playVideoCta;

    this.init();
  }

  /**
   * Init the object.
   */
  HereOverlayCtaVideo.prototype.init = function () {
    this.bindClickEvent();
    this.updateVideoDimensionsOnResize();
  };

  /**
   * Video in colorbox on button click.
   */
  HereOverlayCtaVideo.prototype.bindClickEvent = function () {
    const that = this;

    this.$playVideoCta.on('click tap', function () {
      if (that.settings.mobileOnly && !Drupal.utility.isMobile()) {
        return;
      }

      // Trigger pauseVideo event to ensure that it will be the only one playing video.
      $(document).trigger('pauseVideo', [this]);

      const $this = $(this);
      const colorboxDimensions = that.getColorboxDimensions();

      $('body').css({
        'overflow': 'hidden',
      });

      $this.colorbox({
        href: $this.data('path'),
        width: colorboxDimensions.width,
        height: colorboxDimensions.height,
        fixed: true,
        scrolling: false,
        className: that.settings.colorboxWrapperAdditionalClass,
        onComplete: function () {
          const $loadedModal = $(that.settings.colorboxContentSelector);

          that.setCloseRightOffset(colorboxDimensions.width);

          // Show video and close button with a delay.
          $(that.settings.colorboxCloseSelector, $(that.settings.colorboxWrapperSelector)).delay(100).fadeIn();
          $(that.settings.videoWrapperSelector, $loadedModal).delay(100).fadeIn(function () {
            $(that.settings.videoWrapperSelector).addClass('opened');
          });

          Drupal.noScroll.on();

          if ($(that.settings.videoWrapperSelector + ' video', $loadedModal).length > 0) {
            const video = $(that.settings.videoWrapperSelector + ' video', $loadedModal);
            const videoElement = video.get(0);

            const ratio = (videoElement.videoHeight / videoElement.videoWidth) * 100 + '%';
            video.parent().css({'padding-bottom': ratio});

            Drupal.attachBehaviors($loadedModal.get(0));
          }
          else if ($(that.settings.vidyardToBeElementSelector, $loadedModal).length > 0) {
            that.playVidyardVideo($loadedModal);
          }
          else if ($(that.settings.youtubeToBeElementSelector, $loadedModal).length > 0) {
            that.playYoutubeVideo($loadedModal);
          }
        },
        onClosed: function () {
          $('body').css({
            'overflow': '',
          });
          Drupal.noScroll.off();
          // Hide close button to allow it to fade in again while colorbox opening.
          $(that.settings.colorboxCloseSelector, that.settings.colorboxWrapperSelector).hide();
          $(that.settings.colorboxWrapperSelector).removeClass('opened');
        }
      });
    });
  };

  /**
   * Update video size and position on window resize.
   */
  HereOverlayCtaVideo.prototype.updateVideoDimensionsOnResize = function () {
    const that = this;

    $(window).resize(function () {
      if ($(that.settings.colorboxWrapperSelector).length > 0) {
        const colorboxDimensions = that.getColorboxDimensions();

        $.colorbox.resize(colorboxDimensions);

        that.setCloseRightOffset(colorboxDimensions.width);
      }
    });
  };

  /**
   * Calculate colorbox size.
   *
   * @returns {{width: number, height: number}}
   *   Newly calculated colorbox width and height.
   */
  HereOverlayCtaVideo.prototype.getColorboxDimensions = function () {
    const horizontalStripeMinHeight = 0.1; // 10vh
    const windowWidth = $(window).width();
    const windowHeight = $(window).height();
    let height = windowHeight - (windowHeight * horizontalStripeMinHeight * 2);
    let width = parseInt(height / 9 * 16);

    if (width > windowWidth) {
      width = windowWidth;
      height = parseInt(windowWidth / 16 * 9);
    }

    return {
      'width': width,
      'height': height
    };
  };

  /**
   * Check if user's device is the Apple one.
   *
   * @returns {boolean}
   *   If the operating system is iOS.
   */
  HereOverlayCtaVideo.prototype.isIos = function () {
    const regex = /(iPhone|iPad|iPod);[^OS]*OS (\d)/;
    const matches = navigator.userAgent.match(regex);
    if (!matches) {
      return false;
    }

    return matches[2] < 8;
  };

  /**
   * Set position of colorbox's close closs.
   *
   * @param {number} colorboxWidth
   *   Colorbox actual width.
   */
  HereOverlayCtaVideo.prototype.setCloseRightOffset = function (colorboxWidth) {
    let position = {
      right: 0,
    };
    if (colorboxWidth === $(window).width()) {
      position.right = parseInt(0.05 * $(window).height() / 2) + 'px'; // 0.05 - 5vh.
    }
    if (this.isIos()) {
      position.top = '-' + window.innerHeight * 0.05 + 'px';
    }
    $(this.settings.colorboxCloseSelector, this.settings.colorboxWrapperSelector).css(position);
  };

  /**
   * Play video if the provider is Vidyard.
   *
   * @param {jQuery} $videoWrapper
   *   Video wrapper element.
   */
  HereOverlayCtaVideo.prototype.playVidyardVideo = function ($videoWrapper) {
    const that = this;

    if (typeof VidyardV4 !== 'undefined') {
      const playerUuid = $(that.settings.vidyardToBeElementSelector, $videoWrapper).data('uuid');

      VidyardV4.api.renderDOMPlayers($videoWrapper[0]);
      VidyardV4.api.addReadyListener(function (_, player) {
        if ($.contains($videoWrapper[0], player.container)) {
          player.play();
        }
      }, playerUuid);
    }
    else {
      setTimeout(that.playVidyardVideo, 500);
    }
  };

  /**
   * Play video if provider is YouTube.
   *
   * @param {jQuery} $videoWrapper
   *   Video wrapper element.
   */
  HereOverlayCtaVideo.prototype.playYoutubeVideo = function ($videoWrapper) {
    const that = this;

    if (typeof YT.Player !== undefined) {
      const $video = $(that.settings.youtubeToBeElementSelector, $videoWrapper);

      const player = new YT.Player($video[0], {
        playerVars: {
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
        },
        videoId: $video.data('video-id'),
        host: 'https://www.youtube-nocookie.com',
        events: {
          'onReady': function () {
            if(that.isIos()) {
              player.mute();
            }
            player.playVideo();
          },
        }
      });
    }
  };

  /**
   * A jQuery interface.
   *
   * @param settings
   *
   * @returns {jQuery}
   */
  HereOverlayCtaVideo.jQueryInterface = function (settings) {
    return this.each(function () {
      new HereOverlayCtaVideo($(this), settings);
    });
  };

  $.fn.hereOverlayCtaVideo = HereOverlayCtaVideo.jQueryInterface;

  /**
   * Drupal behaviors for overlay video.
   *
   * @type {{attach: Drupal.behaviors.overlayCtaVideo.attach}}
   */
  Drupal.behaviors.overlayCtaVideo = {
    attach: function (context) {
      $('.cta-video-button.cta-video--overlay', context).once('overlay_video').hereOverlayCtaVideo();
    },
  };

})(jQuery, Drupal);
