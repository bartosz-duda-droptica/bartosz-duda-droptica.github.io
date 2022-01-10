(function ($, Drupal, drupalSettings) {

  'use strict';

  /**
   * HereFiltersFiltering class.
   *
   * @param $wrapper
   *   Filters mechanism wrapper.
   * @param settings
   *   Object with settings to override default.
   *
   * @constructor
   */
  function HereFiltersFiltering($wrapper, settings) {

    /**
     * Default settings.
     */
    this.defaultSettings = {
      // Both forms.
      resultsSelector: '.filters__results',
      paginationSelector: '.filters__pagination',
      paginationItemSelector: '.pagination__list-item .cta',
      emptyElementValue: '_empty',
      singleFilterFormElementSelector: '.filters__form-filters-single-filter',
      // Default form.
      defaultFormSelector: '.filters__default-form',
      defaultResultsSummarySelector: '.filters__default-bar-results-summary',
      defaultFormClearButtonSelector: '.filters__default-bar-results-summary-clear',
      // Mobile form.
      mobileFormSelector: '.filters__mobile-form',
      mobileFormVisibleClass: 'visible',
      mobileFormFiltersWrapperSelector: '.filters__form-filters-wrapper',
      mobileFormFiltersWrapperTopShadowClass: 'top-shadow',
      mobileFormFiltersWrapperBottomShadowClass: 'bottom-shadow',
      mobileFormScrollableAreaSelector: '.filters__form-filters',
      mobileResultsSummarySelector: '.filters__mobile-bar-results-summary',
      mobileFormTriggerFormButtonSelector: '.filters__mobile-bar-form-trigger-button',
      mobileFormClearButtonSelector: '.filters__mobile-form-actions-clear',
      mobileFormApplyButtonSelector: '.filters__mobile-form-actions-apply',
      mobileFormCloseButtonSelector: '.close-mobile-filters',
      // Mobile form - show more.
      singleFilterCollapsibleSelector: '.collapsible-options',
      singleFilterToggleCollapseSelector: '.filters__form-filters-single-filter-toggle-collapse',
      singleFilterCollapsibleCollapsedClass: 'collapsed',
      showMoreClass: 'show-more',
      showLessClass: 'show-less',
      // Main navigation.
      mainNavigationSelector: '.navigation--main',
      mainNavigationFadeOutClass: 'animate-fade-out',
      mainNavigationFadeInClass: 'animate-fade-in',
    };

    /**
     * Settings.
     */
    this.settings = $.extend(true, this.defaultSettings, settings || {});

    /**
     * Element wrapping the whole filters mechanism.
     *
     * @type {jQuery|{}}
     */
    this.$wrapper = $wrapper;

    /**
     * Default form.
     *
     * @type {jQuery|{}}
     */
    this.$defaultForm = $wrapper.find(this.settings.defaultFormSelector);

    /**
     * Default results summary.
     *
     * @type {jQuery|{}}
     */
    this.$defaultResultsSummary = $wrapper.find(this.settings.defaultResultsSummarySelector);

    /**
     * Mobile form.
     *
     * @type {jQuery|{}}
     */
    this.$mobileForm = $wrapper.find(this.settings.mobileFormSelector);

    /**
     * Mobile form wrapper.
     *
     * @type {jQuery|{}}
     */
    this.$mobileFormFiltersWrapper = $wrapper.find(this.settings.mobileFormFiltersWrapperSelector);

    /**
     * Mobile form.
     *
     * @type {jQuery|{}}
     */
    this.$mobileFormScrollableArea = this.$mobileForm.find(this.settings.mobileFormScrollableAreaSelector);

    /**
     * Mobile results summary.
     *
     * @type {jQuery|{}}
     */
    this.$mobileResultsSummary = $wrapper.find(this.settings.mobileResultsSummarySelector);

    /**
     * Mobile form trigger form button.
     *
     * @type {jQuery|{}}
     */
    this.$mobileFormTriggerFormButton = $wrapper.find(this.settings.mobileFormTriggerFormButtonSelector);

    /**
     * Mobile form apply button.
     *
     * @type {jQuery|{}}
     */
    this.$mobileFormApplyButton = $wrapper.find(this.settings.mobileFormApplyButtonSelector);

    /**
     * Mobile form clear button.
     *
     * @type {jQuery|{}}
     */
    this.$mobileFormClearButton = $wrapper.find(this.settings.mobileFormClearButtonSelector);

    /**
     * Mobile form close button.
     *
     * @type jQuery|{}}
     */
    this.$mobileFormCloseButton = $wrapper.find(this.settings.mobileFormCloseButtonSelector);

    /**
     * Results wrapper.
     *
     * @type {jQuery|{}}
     */
    this.$results = $wrapper.find(this.settings.resultsSelector);

    /**
     * Pagination wrapper.
     *
     * @type {jQuery|{}}
     */
    this.$pagination = $wrapper.find(this.settings.paginationSelector);

    /**
     * Main navigation of the site.
     *
     * @type jQuery|{}}
     */
    this.$mainNavigation = $(this.settings.mainNavigationSelector);

    this.init();
  }

  /**
   * Init the object.
   */
  HereFiltersFiltering.prototype.init = function () {
    this.filterResults();
    this.handlePagination();
    this.handleDefaultForm();
    this.handleMobileForm();
    this.synchronizeForms();
  };

  /**
   * Handle pagination.
   */
  HereFiltersFiltering.prototype.handlePagination = function () {
    var self = this;

    this.$wrapper.on('click', this.settings.paginationItemSelector, function () {
      self.paginateResults($(this).data('href'));

      return false;
    });
  };

  /**
   * Handle events on default form.
   */
  HereFiltersFiltering.prototype.handleDefaultForm = function () {
    var self = this;

    this.$defaultForm.find('select').change(function () {
      self.filterResults();
    });

    this.$wrapper.on('click', this.settings.defaultFormClearButtonSelector, function () {
      self.clearForms();
      self.filterResults();

      return false;
    });
  };

  /**
   * Handle events on mobile form.
   */
  HereFiltersFiltering.prototype.handleMobileForm = function () {
    var self = this;

    // Check if shadows need to be added.
    this.$mobileFormScrollableArea.scroll(function () {
      self.checkMobileFormShadows();
    });

    // Expand / collapse collapsible options.
    $(this.settings.singleFilterToggleCollapseSelector, this.$mobileForm).click(function () {
      var $parent = $(this).closest(self.settings.singleFilterCollapsibleSelector);

      $parent.toggleClass(self.settings.singleFilterCollapsibleCollapsedClass);

      return false;
    });

    // Open mobile form on clicking the button.
    this.$mobileFormTriggerFormButton.click(function () {
      self.openMobileForm();

      return false;
    });

    // Close mobile form on clicking the button.
    this.$mobileFormCloseButton.click(function () {
      self.closeMobileForm();

      return false;
    });

    // Filter results on clicking the 'Apply' button.
    this.$mobileFormApplyButton.click(function () {
      self.filterResults();
      self.closeMobileForm();

      return false;
    });

    // Clear form then filter results on clicking 'Clear' button.
    this.$mobileFormClearButton.click(function () {
      self.clearForms();
      self.filterResults();
      self.closeMobileForm();

      return false;
    });
  };

  /**
   * Forms operations synchronization.
   */
  HereFiltersFiltering.prototype.synchronizeForms = function () {
    var forms = $('form', this.$wrapper);

    $('input, select', forms).change(function () {
      var changedElement = this;
      var name = $(changedElement).attr('name');
      var value = $(changedElement).val();

      $('[name=' + name + ']', forms).each(function () {
        if (this !== changedElement) {
          // Radio.
          $(this).filter(function () {
            return $(this).is(':radio') && $(this).val() === value;
          }).prop('checked', true);

          // Select.
          var $select = $(this).filter('select');
          $select.val(value);
          $select.trigger("chosen:updated");
        }
      });
    });
  };

  /**
   * Clear forms filter options.
   */
  HereFiltersFiltering.prototype.clearForms = function () {
    var forms = $('form', this.$wrapper);
    var self = this;
    this.$wrapper.trigger('clear-filters-tracking', [self.settings.contentType]);

    $('input, select', forms).each(function () {
      $(this).filter(function () {
        return $(this).is(':radio') && $(this).val() === self.settings.emptyElementValue;
      }).prop('checked', true);

      var $select = $(this).filter('select');
      $select.val(self.settings.emptyElementValue);
      $select.trigger("chosen:updated");
    });
  };

  /**
   * Open mobile form.
   */
  HereFiltersFiltering.prototype.openMobileForm = function () {
    this.$mobileForm.addClass(this.settings.mobileFormVisibleClass);
    this.$mainNavigation
      .removeClass(this.settings.mainNavigationFadeInClass)
      .addClass(this.settings.mainNavigationFadeOutClass);

    this.checkMobileFormShadows();

    Drupal.noScroll.on();
  };

  /**
   * Close mobile form.
   */
  HereFiltersFiltering.prototype.closeMobileForm = function () {
    this.$mobileForm.removeClass(this.settings.mobileFormVisibleClass);
    this.$mainNavigation
      .removeClass(this.settings.mainNavigationFadeOutClass)
      .addClass(this.settings.mainNavigationFadeInClass);

    Drupal.noScroll.off();
  };

  /**
   * Manages shadows on mobile form.
   */
  HereFiltersFiltering.prototype.checkMobileFormShadows = function () {
    this.$mobileFormFiltersWrapper
      .removeClass(this.settings.mobileFormFiltersWrapperTopShadowClass)
      .removeClass(this.settings.mobileFormFiltersWrapperBottomShadowClass);

    var currentScroll = this.$mobileFormScrollableArea.scrollTop();
    var scrollableAreaHeight = this.$mobileFormScrollableArea.outerHeight();
    var totalScroll = this.$mobileFormScrollableArea[0].scrollHeight;

    // Top shadow.
    if (currentScroll > 0) {
      this.$mobileFormFiltersWrapper.addClass(this.settings.mobileFormFiltersWrapperTopShadowClass);
    }

    // Bottom shadow.
    if (currentScroll + scrollableAreaHeight < totalScroll) {
      this.$mobileFormFiltersWrapper.addClass(this.settings.mobileFormFiltersWrapperBottomShadowClass);
    }
  };

  /**
   * Filter results by chosen filters.
   */
  HereFiltersFiltering.prototype.filterResults = function () {
    var self = this;
    var endpoint = '/' + drupalSettings.path.pathPrefix + 'here-filters/filters-results/' + self.settings.contentType;

    $.getJSON(endpoint, self.prepareQuery()).done(function (data) {
      self.$defaultResultsSummary.html(data.resultsSummary);
      self.$mobileResultsSummary.html(data.resultsShortSummary);
      self.$results.html(data.items);
      Drupal.attachBehaviors(self.$results.get(0));
      if (data.pagination.markup == undefined) {
        self.$pagination.html('');
      }
      else {
        self.$pagination.html(data.pagination.markup);
      }

      self.$results.find('.cta.clear').once('here-filters-clear').click(function () {
        self.clearForms();
        self.filterResults();

        return false;
      });
    });
  };

  /**
   * Get page results and place them with a proper method.
   *
   * @param endpoint
   *   Query results endpoint.
   */
  HereFiltersFiltering.prototype.paginateResults = function (endpoint) {
    var self = this;

    $.getJSON(endpoint).done(function (data) {
      if (data.pagination.method == 'replace') {
        self.animateToTop();
        self.$results.html(data.items);
      }
      else {
        self.$results.append(data.items);
      }
      Drupal.attachBehaviors(self.$results.get(0));
      self.$pagination.html(data.pagination.markup);
    });
  };

  /**
   * Prepare query based on selected filters.
   *
   * @returns {{items_per_page: *, filters: {}}}
   */
  HereFiltersFiltering.prototype.prepareQuery = function () {
    var filters = {};

    this.$defaultForm.find('select').each(function () {
      var selectedOption = $(this).val();

      if (selectedOption != '') {
        filters[$(this).attr('name')] = selectedOption;
      }
    });

    return {
      items_per_page : this.settings.itemsPerPage,
      pagination_style: this.settings.paginationStyle,
      filters: filters,
    };
  };

  /**
   * Animate page scroll top to the start of the results.
   */
  HereFiltersFiltering.prototype.animateToTop = function () {
    var targetOffset = this.$results.offset().top;
    var bodyPadding = parseInt($('body').css('padding-top'));
    var menuHeight = parseInt($('.navigation--main .navigation__bottom').outerHeight());

    $('html, body').animate({
      scrollTop: targetOffset - bodyPadding - menuHeight,
    }, 500);
  };

  /**
   * A jQuery interface.
   *
   * @param settings
   *
   * @returns {jQuery}
   */
  HereFiltersFiltering.jQueryInterface = function (settings) {
    return this.each(function () {
      new HereFiltersFiltering($(this), settings);
    });
  };

  $.fn.hereFiltersFiltering = HereFiltersFiltering.jQueryInterface;

  /**
   * Drupal behaviors for filtering.
   *
   * @type {{attach: Drupal.behaviors.hereFiltersFiltering.attach}}
   */
  Drupal.behaviors.hereFiltersFiltering = {
    attach: function (context) {
      $('.filters', context).once('here-filters-filtering').hereFiltersFiltering(drupalSettings.hereFilters);
    }
  };

})(jQuery, Drupal, drupalSettings);
