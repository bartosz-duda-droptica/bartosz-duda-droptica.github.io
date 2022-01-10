(function ($, Drupal) {

  'use strict';

  function HereInlineCtaVideo($wrapper, settings) {

    /**
     * All available statuses.
     *
     * @type {string}
     */
    this.STATUS_HIDDEN = 'hidden';
    this.STATUS_HIDING = 'hiding';
    this.STATUS_SHOWING = 'showing';
    this.STATUS_PLAYING = 'playing';
    this.STATUS_PAUSED = 'paused';

    /**
     * Default settings.
     */
    this.defaultSettings = {
      // Selectors.
      videoParentMediaSelector: '.paragraph--type--image-or-video, .here-map',
      playVideoCtaSelector: '.cta-video-button.cta-video--inline',
      videoWrapperSelector: '.video-wrapper, .video-embed-wrapper',
      vidyardToBeElementSelector: 'img.vidyard-player-embed',
      youtubeToBeElementSelector: 'div.youtube-embed-player',
      // Classes.
      videoBoxClass: 'cta-video__video-wrapper',
      videoBoxOverlayClass: 'cta-video__video-overlay',
      nativeVideoWrapperClass: 'video-wrapper',
      vidyardVideoWrapperClass: 'video-embed-wrapper--vidyard',
      youtubeVideoWrapperClass: 'video-embed-wrapper--youtube',
      // Others.
      notOnMobile: false,
    };

    /**
     * Settings.
     */
    this.settings = $.extend(true, this.defaultSettings, settings || {});

    /**
     * Element for video to be resolved.
     *
     * @type {jQuery|{}}
     */
    this.$wrapper = $wrapper;

    /**
     * Video play CTA.
     *
     * @type {jQuery|{}}
     */
    this.$playVideoCta = $wrapper.find(this.settings.playVideoCtaSelector);

    /**
     * DOM element where the video is placed via AJAX.
     *
     * @type {jQuery|{}}
     */
    this.$videoBox = '';

    /**
     * Wrapper of the video.
     *
     * @type {jQuery|{}}
     */
    this.$videoWrapper = '';

    /**
     * Video element.
     *
     * @type {jQuery|{}}
     */
    this.$video = '';

    /**
     * Video single item.
     *
     * @type {HTMLElement}
     */
    this.$videoItem = '';

    /**
     * Actual player state.
     *
     * @type {string}
     */
    this.state = this.STATUS_HIDDEN;

    /**
     * Video provider.
     *
     * @type {string}
     */
    this.provider = 'native';

    /**
     * Whether the video is in fullscreen mode.
     *
     * @type {boolean}
     */
    this.fullScreen = false;

    /**
     * Flag for Vidyard, holds true if the video has been played once.
     *
     * @type {boolean}
     */
    this.vidyardInitializedOnce = false;

    this.init();
  }

  /**
   * Init the object.
   */
  HereInlineCtaVideo.prototype.init = function () {
    const that = this;

    if (that.$wrapper.find(that.settings.playVideoCtaSelector).length == 0) {
      return;
    }

    that.$videoBox = $("<div>", {"class": that.settings.videoBoxClass}).appendTo($(that.settings.videoParentMediaSelector, that.$wrapper));
    that.$videoBoxOverlay = $("<div>", {"class": that.settings.videoBoxOverlayClass}).appendTo($(that.settings.videoParentMediaSelector, that.$wrapper));

    // Add events listeners.
    that.$playVideoCta.on('click', that.toggleVideo.bind(that));
    that.$playVideoCta.on('pauseVideo', that.pauseVideo.bind(that));

    // Listen for pauseVideo events when other video starts playing.
    $(document).on('pauseVideo', function (e, newVideo) {
      if (newVideo !== that) {
        that.pauseVideo(that);
      }
    });

    // Wait little bit fo other scripts and trigger the initiated event.
    setTimeout(function () {
      that.$videoBox.trigger('HereInlineCtaVideo:initiated');
    }, 500);
  };

  /**
   * Set the state of the video player.
   *
   * @param {string} state
   */
  HereInlineCtaVideo.prototype.setState = function (state) {
    this.$wrapper.removeClass('state-' + this.state);
    this.$wrapper.addClass('state-' + state);

    this.$videoBox.removeClass('state-' + this.state);
    this.$videoBox.addClass('state-' + state);

    this.$playVideoCta.removeClass('state-' + this.state);
    this.$playVideoCta.addClass('state-' + state);


    this.state = state;

    this.$videoBox.trigger('HereInlineCtaVideo:' + state);
  };

  /**
   * Play or pause the video.
   *
   * @returns {boolean}
   */
  HereInlineCtaVideo.prototype.toggleVideo = function () {
    const that = this;

    if (that.settings.notOnMobile && Drupal.utility.isMobile()) {
      return;
    }

    if (that.$videoBox.is(':empty')) {
      $.ajax({
        url: that.$playVideoCta.data('path'),
        success: function (data) {
          that.$videoBox.append(data);
          Drupal.attachBehaviors(that.$videoBox.get(0));
          that.getVideo();
          return;
        }
      });
    }
    else {
      if (that.state === that.STATUS_PLAYING) {
        that.pauseVideo();
      }
      else {
        that.playVideo();
      }
    }

    return false;
  };

  /**
   * Back the player to its initial state.
   */
  HereInlineCtaVideo.prototype.backToInitState = function () {
    const that = this;

    that.leaveFullScreen();

    // Set small timeout to fix Vidyard issue when leaving fullscreen.
    setTimeout(function () {
      that.$videoBoxOverlay.css('z-index', 50).animate({opacity: 1}, 300, function () {
        that.$videoWrapper.hide();
        that.setState(that.STATUS_HIDING);

        $(this).animate({opacity: 0}, 800, function () {
          $(this).css('z-index', 0);
          that.setState(that.STATUS_HIDDEN);
        });
      });
      that.$videoWrapper.css('pointer-events', 'none');
    }, 10);
  };

  /**
   * Enable Youtube.
   */
  HereInlineCtaVideo.prototype.enableYoutube = function () {
    const that = this;
    let timeout = null;

    if (typeof YT.Player !== undefined) {
      that.$video = $(that.settings.youtubeToBeElementSelector, that.$videoWrapper);

      that.$videoItem = new YT.Player(that.$video[0], {
        videoId: that.$video.data('video-id'),
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          rel: 0,
          modestbranding: 1,
        },
        events: {
          'onReady': function () {
            that.playVideo();
          },
          'onStateChange' : function (event) {
            // If video has ended.
            if (event.data == 0) {
              that.pauseVideo();
            }

            // If video is paused.
            // On Youtube video seek action also triggers paused event, but followed by other states.
            // We have to check if another state came shortly after the paused.
            clearTimeout(timeout);
            timeout = setTimeout(function () {
              if (event.data == 2) {
                that.pauseVideo();
              }
            }, 250);
          },
        }
      });
    }
  };

  /**
   * Enable vidyard.
   */
  HereInlineCtaVideo.prototype.enableVidyard = function () {
    const that = this;

    if (typeof VidyardV4 !== 'undefined') {
      const uuid = $(that.settings.vidyardToBeElementSelector, that.$videoWrapper).data('uuid');
      VidyardV4.api.renderDOMPlayers(that.$videoWrapper[0]);
      VidyardV4.api.addReadyListener(function (_, player) {

        player.on('pause', function () {
          if (player.scrubbing()) {
            return;
          }
          else {
            if (that.state == that.STATUS_PLAYING) {
              that.backToInitState();
            }
          }
        });

        player.on('playerComplete', that.backToInitState.bind(that));
        player.on('fullScreenChange', that.setFullScreen.bind(that));

        if ($.contains(that.$videoWrapper[0], player.container)) {
          that.$video = $('.vidyard-player-container', that.$videoWrapper);
          that.$videoItem = player;

          if (!that.vidyardInitializedOnce) {
            that.vidyardInitializedOnce = !that.vidyardInitializedOnce;
            that.playVideo();
          }
        }
      }, uuid);
    }
    else {
      // Wait until Vidyard is defined.
      setTimeout((function (scope) {
        // Pass the function and context to setTimeout.
        return function () {
          scope.enableVidyard();
        };
      })(this), 500);
    }
  };

  /**
   * Resolve all video variables and make video play for the first time.
   */
  HereInlineCtaVideo.prototype.getVideo = function () {
    const that = this;

    that.$videoWrapper = $(that.settings.videoWrapperSelector, that.$videoBox);

    if (that.$videoWrapper.hasClass(that.settings.nativeVideoWrapperClass)) {
      that.$video = $('video', that.$videoWrapper);
      that.$videoItem = that.$video.get(0);
      that.$video.on('pause', that.backToInitState.bind(that));
      that.playVideo();
    }
    else if (that.$videoWrapper.hasClass(that.settings.vidyardVideoWrapperClass)) {
      that.provider = 'vidyard';
      that.enableVidyard();
    }
    else if (that.$videoWrapper.hasClass(that.settings.youtubeVideoWrapperClass)) {
      that.provider = 'youtube';
      that.enableYoutube();
    }
  };

  /**
   * Play the video.
   */
  HereInlineCtaVideo.prototype.playVideo = function () {
    const that = this;

    // Trigger pauseVideo event to ensure that it will be the only one playing video.
    $(document).trigger('pauseVideo', [this]);

    that.$videoBoxOverlay.css('z-index', 999).animate({opacity: 1}, 800);
    // Fix for Safari. When video is unmuted it cannot be in an animation complete callback.
    setTimeout(function () {
      that.setState(that.STATUS_SHOWING);
      that.$videoWrapper.show();

      that.$videoBoxOverlay.animate({opacity: 0}, 300, function () {
        that.$videoBoxOverlay.css('z-index', 0);
        that.setState(that.STATUS_PLAYING);
      });

      if (that.provider != 'youtube') {
        that.$videoItem.play();
      }
      else {
        that.$videoItem.playVideo();
      }

    },800);
    that.$videoWrapper.css('pointer-events', 'auto');
  };

  /**
   * Pause the video.
   */
  HereInlineCtaVideo.prototype.pauseVideo = function () {
    if (this.state === this.STATUS_PLAYING) {
      this.setState(this.STATUS_PAUSED);
      if (this.provider != 'youtube') {
        this.$videoItem.pause();
      }
      else {
        this.$videoItem.pauseVideo();
      }
      this.backToInitState();
    }
  };

  /**
   * Set fullscreen variable.
   *
   * @param {boolean} isFullScreen
   */
  HereInlineCtaVideo.prototype.setFullScreen = function (isFullScreen) {
    this.fullScreen = isFullScreen;
  };

  HereInlineCtaVideo.prototype.isFullScreen = function () {
    const that = this;
    const videoUUID = that.$video.data('uuid');
    if (videoUUID && Drupal.videosWithControls.videos[videoUUID] !== undefined) {
      return Drupal.videosWithControls.videos[videoUUID].isFullScreen();
    }

    return !!(this.fullScreen || document.fullScreen || document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement || document.fullscreenElement);
  };

  /**
   * Leave fullscreen mode.
   */
  HereInlineCtaVideo.prototype.leaveFullScreen = function () {
    const that = this;

    switch (that.source) {
      case 'vidyard':
        if (that.isFullScreen()) {
          that.$videoItem.toggleFullscreen();
        }
        break;

      default:
        const videoUUID = that.$video.data('uuid');
        if (videoUUID && Drupal.videosWithControls.videos[videoUUID] !== undefined) {
          if (that.isFullScreen()) {
            Drupal.videosWithControls.videos[videoUUID].handleFullScreen();
          }
        }
    }
  };

  /**
   * A jQuery interface.
   *
   * @param settings
   *
   * @returns {jQuery}
   */
  HereInlineCtaVideo.jQueryInterface = function (settings) {
    return this.each(function () {
      const parentSelector = $(this).data('parent');
      const $wrapper = $(this).closest(parentSelector);
      new HereInlineCtaVideo($wrapper, settings);
    });
  };

  $.fn.hereInlineCtaVideo = HereInlineCtaVideo.jQueryInterface;

  /**
   * Drupal behaviors for tabs.
   *
   * @type {{attach: Drupal.behaviors.inlineCtaVideo.attach}}
   */
  Drupal.behaviors.inlineCtaVideo = {
    attach: function (context) {
      $('.cta-video-button.cta-video--inline', context).once('inline_video_desktop').hereInlineCtaVideo({
        notOnMobile: true,
      });

      $('.cta-video-button.cta-video--inline', context).once('inline_video_mobile').hereOverlayCtaVideo({
        mobileOnly: true,
      });
    },
  };

})(jQuery, Drupal);
