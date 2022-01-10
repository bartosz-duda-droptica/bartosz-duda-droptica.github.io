(function($, Drupal, drupalSettings, debounce) {

  'use strict';

  function HereRenderedVideoWithBreakpoints($wrapper) {

    /**
     * Settings for the object.
     *
     * @type {{loadedFlagClass: string, mobileVideoBreakpointSelector: string, videoContainerSelector: string, desktopVideoBreakpointSelector: string, tabletVideoBreakpointSelector: string}}
     */
    this.settings = {
      videoContainerSelector: '.video-container',
      loadedFlagClass: 'loaded',
      mobileVideoBreakpointSelector: '.here-rendered-video-mobile',
      tabletVideoBreakpointSelector: '.here-rendered-video-tablet',
      desktopVideoBreakpointSelector: '.here-rendered-video-desktop',
    };

    /**
     * Breakpoints wrapper.
     *
     * @type {jQuery}
     */
    this.$wrapper = $wrapper;

    /**
     * List of possible breakpoints.
     *
     * @type {{tablet: jQuery, desktop: jQuery, mobile: jQuery}}
     */
    this.breakpointContainers = {
      'mobile': this.$wrapper.find(this.settings.mobileVideoBreakpointSelector),
      'tablet': this.$wrapper.find(this.settings.tabletVideoBreakpointSelector),
      'desktop': this.$wrapper.find(this.settings.desktopVideoBreakpointSelector),
    };

    /**
     * Currently active breakpoint.
     *
     * @type {string}
     */
    this.currentBreakpoint = '';

    this.init();
  }

  /**
   * Init the object.
   */
  HereRenderedVideoWithBreakpoints.prototype.init = function () {
    this.showBreakpoint();
    this.bindResizeEvent();
  };

  /**
   * Binds the window resize event so different breakpoints can be loaded.
   */
  HereRenderedVideoWithBreakpoints.prototype.bindResizeEvent = function () {
    const self = this;

    $(window).resize(debounce(function () {
      self.showBreakpoint();
    }, 500));
  };

  /**
   * Shows current breakpoint.
   */
  HereRenderedVideoWithBreakpoints.prototype.showBreakpoint = function () {
    const isNewBreakpoint = this.setCurrentBreakpoint();

    // Don't do anything if breakpoint didn't change.
    if (!isNewBreakpoint) {
      return;
    }

    // Don't do anything if there is no breakpoint container.
    const $container = this.breakpointContainers[this.currentBreakpoint];
    if ($container.length === 0) {
      return;
    }

    // Hide all containers and show the correct one.
    this.breakpointContainers['mobile'].hide();
    this.breakpointContainers['tablet'].hide();
    this.breakpointContainers['desktop'].hide();
    this.breakpointContainers[this.currentBreakpoint].show();

    // Load the video.
    this.loadVideo($container);
  };

  /**
   * Setter for current breakpoint.
   *
   * @return {boolean}
   *   True if new breakpoint is different than current.
   */
  HereRenderedVideoWithBreakpoints.prototype.setCurrentBreakpoint = function () {
    const device = Drupal.utility.getDeviceName();

    let newBreakpoint = '';
    switch (device) {
      case 'mobile':
        newBreakpoint = 'mobile';
        if (this.breakpointContainers[newBreakpoint].length === 0) {
          newBreakpoint = 'tablet';
        }
        if (this.breakpointContainers[newBreakpoint].length === 0) {
          newBreakpoint = 'desktop';
        }
        break;

      case 'tabletS':
        newBreakpoint = 'tablet';
        if (this.breakpointContainers[newBreakpoint].length === 0) {
          newBreakpoint = 'desktop';
        }
        break;

      default:
        newBreakpoint = 'desktop';
        break;
    }

    if (this.currentBreakpoint !== newBreakpoint) {
      this.currentBreakpoint = newBreakpoint;

      return true;
    }

    return false;
  };

  /**
   * Loads video for current breakpoint if there is any video.
   *
   * @param {jQuery} $container
   *   Breakpoint container.
   */
  HereRenderedVideoWithBreakpoints.prototype.loadVideo = function ($container) {
    const self = this;
    const $element = $container.find(this.settings.videoContainerSelector);
    if ($element.length === 0 || $container.hasClass(this.settings.loadedFlagClass)) {
      return;
    }

    const id = $element.data('revision-id');
    const fieldName = $element.data('field-name');

    const endpoint = '/' + drupalSettings.path.pathPrefix + 'cms/background-video/' + id + '/' + fieldName;
    $.getJSON(endpoint).done(function (data) {
      $element.html(data.video);

      var $player = $element.find('iframe').length > 0 ? $element.find('iframe') : $element.find('video');
      if ($player.length > 0) {
        Drupal.attachBehaviors($element.get(0));

        // Some videos like Vimeo has to be buffered first before they will be flagged as loaded.
        var waitUntilBuffered = typeof $player.data('buffered') !== 'undefined';
        var timer = setInterval(function () {
          if (!waitUntilBuffered) {
            $container.addClass(self.settings.loadedFlagClass);
            clearInterval(timer);
          }
          else {
            if ($player.data('buffered') == true) {
              waitUntilBuffered = false;
            }
          }
        }, 100);
      }
    });
  };

  /**
   * A jQuery interface.
   *
   * @returns {jQuery}
   */
  HereRenderedVideoWithBreakpoints.jQueryInterface = function () {
    return this.each(function () {
      new HereRenderedVideoWithBreakpoints($(this));
    });
  };

  $.fn.hereRenderedVideoWithBreakpoints = HereRenderedVideoWithBreakpoints.jQueryInterface;

  /**
   * Behaviors for videos with breakpoints.
   */
  Drupal.behaviors.renderedVideoWithBreakpoints = {
    attach: function (context) {
      $('.here-rendered-video-wrapper', context).once('rendered-video-with-breakpoints').hereRenderedVideoWithBreakpoints();
    }
  };

})(jQuery, Drupal, drupalSettings, Drupal.debounce);
