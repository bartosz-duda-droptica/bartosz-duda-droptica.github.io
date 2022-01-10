/**
 * @file
 * Behavior for partners list.
 */

(function ($, Drupal) {

  'use strict';

  function ContentFiltering($wrapper) {
    /**
     * How long the animation for mobile form should be.
     *
     * @type {number}
     */
    this.mobileFormAnimationDuation = 250;

    /**
     * CSS classes for animating results.
     *
     * @type {{in: string, out: string}}
     */
    this.classes = {
      in: 'animate-fade-in',
      out: 'animate-fade-out',
    };

    /**
     * DOM element containing the forms.
     *
     * @type {jQuery}
     */
    this.$formsContainer = $wrapper.find('.content-filtering-forms');

    /**
     * DOM element containing the results.
     *
     * @type {jQuery}
     */
    this.$contentContainer = $wrapper.find('.content-filtering-content');

    /**
     * Object with values selected by the user, key is filter UUID.
     *
     * @type {{}}
     */
    this.values = {};

    this.bindDesktopInput();
    this.bindMobileInput();
  }

  /**
   * Fade and scroll animation for filtering form.
   *
   * @param {string} val
   *   Fade in or out.
   * @param {jQuery} $form
   *   Element to apply animation on.
   *
   * @return void
   */
  ContentFiltering.prototype.mobileFormAnimation = function (val, $form) {
    const self = this;

    if (val === 'in') {
      $form.stop(true, true).fadeIn({
        duration: self.mobileFormAnimationDuation,
        queue: false
      }).css('display', 'none').slideDown(250);
      Drupal.noScroll.on();
    }
    else if (val === 'out') {
      $form.stop(true, true).fadeOut({
        duration: self.mobileFormAnimationDuation,
        queue: false
      }).css('display', 'flex').slideUp(250);
      Drupal.noScroll.off();
    }
  };

  /**
   * Fades in the results.
   */
  ContentFiltering.prototype.fadeIn = function () {
    this.$contentContainer.removeClass(this.classes.out)
      .addClass(this.classes.in);
  };

  /**
   * Fades out the results.
   */
  ContentFiltering.prototype.fadeOut = function () {
    this.$contentContainer.removeClass(this.classes.in)
      .addClass(this.classes.out);
  };

  /**
   * Binds desktop interactions.
   */
  ContentFiltering.prototype.bindDesktopInput = function () {
    const self = this;

    this.$formsContainer.find('select').change(function () {
      self.synchronizeForms(this);
      self.manageValue($(this));
      self.filterResults();
    });
  };

  /**
   * Binds mobile interactions.
   */
  ContentFiltering.prototype.bindMobileInput = function () {
    const self = this;

    // Clear form button press.
    self.$formsContainer.find('.clear-form').click(function (e) {
      e.preventDefault();
      self.resetForms();
      self.filterResults();
    });

    // Apply filter button press.
    self.$formsContainer.find('.apply-filters').click(function (e) {
      e.preventDefault();
      self.applyMobile();
      self.filterResults();
    });

    // Showing/hiding mobile form.
    $(document).mouseup(function (e) {
      let $mobileForm = $('.content-filtering-form-mobile-wrapper form');
      let $triggers = $('.content-filtering-form-mobile-toggle-button, .button');
      if ($triggers.is(e.target) && $triggers.has(e.target).length === 0) {
        if ($mobileForm.is(':hidden')) {
          self.mobileFormAnimation('in', $mobileForm);
          $mobileForm.css('display', 'flex');
        }
        else {
          self.mobileFormAnimation('out', $mobileForm);
        }
      }
      else if ($mobileForm.is(':visible') && $mobileForm.has(e.target).length === 0 && !$(e.target).is($mobileForm)) {
        self.mobileFormAnimation('out', $mobileForm);
      }
    });
  };

  /**
   * Manages the value, either adds it or removes it from the values object.
   *
   * @param {jQuery} $input
   *   The interacted input, either select or input HTML element.
   */
  ContentFiltering.prototype.manageValue = function ($input) {
    const name = $input.attr('name');
    const value = $input.val();

    if (value === '0' || value === '') {
      // Remove the key from array if it exists.
      if (this.values[name] !== undefined) {
        delete this.values[name];
      }
    }
    else {
      if ($input.is('select')) {
        this.values[name] = $input.find('option:selected').text();
      }
      else {
        this.values[name] = $input.siblings('label').text();
      }
    }
  };

  /**
   * Filters results and shows only those that match the criteria.
   */
  ContentFiltering.prototype.filterResults = function () {
    const self = this;

    self.fadeOut();
    setTimeout(function () {
      self.$contentContainer
        .removeClass('no-results')
        .find('.filtered-item')
        .show()
        .each(function () {
          let $item = $(this);
          for (let filter_key in self.values) {
            let value = "'" + self.values[filter_key] + "'";
            let itemData = $item.data(filter_key);

            if (itemData.indexOf(value) === -1) {
              $item.hide();
            }
          }
        });

      if (self.$contentContainer.find('.filtered-item:visible').length === 0) {
        self.$contentContainer.addClass('no-results');
      }
      self.fadeIn();
    }, 300);
  };

  /**
   * Synchronizes forms so each version shows correct value selected.
   */
  ContentFiltering.prototype.synchronizeForms = function (changed_element) {
    const name = $(changed_element).attr('name');
    const value = $(changed_element).val();

    $('[name=' + name + ']', this.$formsContainer).each(function () {
      if (this === changed_element) {
        return;
      }

      // Radio.
      $(this).filter(function () {
        return $(this).is(':radio') && $(this).val() === value;
      }).prop('checked', true);

      // Select.
      $(this).filter('select').val(value).trigger('chosen:updated');
    });
  };

  /**
   * Resets forms to default state.
   */
  ContentFiltering.prototype.resetForms = function () {
    this.$formsContainer.find('form').trigger('reset');
    this.$formsContainer.find('select').trigger('chosen:updated');
    this.values = {};
  };

  /**
   * Logic for apply button on mobile.
   */
  ContentFiltering.prototype.applyMobile = function () {
    const self = this;

    self.$formsContainer.find('input:checked').each(function () {
      self.synchronizeForms(this);
      self.manageValue($(this));
    });
  };

  /**
   * A jQuery interface.
   *
   * @returns {jQuery}
   */
  ContentFiltering.jQueryInterface = function () {
    return this.each(function () {
      new ContentFiltering($(this));
    });
  };

  $.fn.contentFiltering = ContentFiltering.jQueryInterface;

  Drupal.behaviors.contentFiltering = {
    attach: function (context) {
      $('.content-filtering-container', context).once('content-filtering').contentFiltering();
    }
  };

})(jQuery, Drupal);
