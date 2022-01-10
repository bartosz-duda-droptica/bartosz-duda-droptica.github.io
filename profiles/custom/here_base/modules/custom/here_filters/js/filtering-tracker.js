/**
 * @file
 * Tracking for the filtering form.
 */

(function ($, Drupal) {

  /**
   * Emits utag view event with given parameters.
   *
   * @param {string} linkEvent
   *   Name of the link event.
   * @param {string} eventName
   *   Name of the event.
   * @param {string} eventValue
   *   Value of the event.
   */
  function emitUtagFilterEvent(linkEvent, eventName, eventValue) {
    if (typeof utag !== 'undefined' && utag !== null) {
      var view_object = {};

      view_object['linkEvent'] = linkEvent;
      view_object[eventName] = eventValue;

      utag.view(view_object);
    }
  }

  /**
   * Returns the machine name of content type for events tracking.
   *
   * @param {string} content_type
   *   Name of the content type being filtered.
   *
   * @returns {string}
   *   The machine name used for event tracking.
   */
  function getFiltersMachineName(content_type) {
    var machine_name = content_type.replace(/[-_]/g,'');

    // Exception, if we filter press release, the machine name is "newsroom".
    if (machine_name === 'pressrelease') {
      machine_name = 'newsroom';
    }

    return machine_name;
  }

  Drupal.behaviors.hereFiltersTracking = {
    attach: function (context) {
      $('.filter-module', context).once('here-filters-tracking').each(function () {
        // Send event when input has been changed.
        $('form input, form select', this).change(function () {
          var $element = $(this);
          var $selected = $element.children(":selected");
          var filter_field = $element.attr('data-filter-name').toLowerCase().split(' ').join('_');

          var value = '';
          if ($selected.length !== 0) {
            value = $selected.text().toLowerCase().split(' ').join('_');
          }
          else if ($element.is(":checked")) {
            value = $element.siblings('label').text().toLowerCase().split(' ').join('_');
          }

          var content_type = $element.closest('form').attr('data-content-type');
          var machine_name = getFiltersMachineName(content_type);

          // Event value format: machinename:filter:filter_field:value.
          var event_value = machine_name + ':filter:' + filter_field + ':' + value;

          emitUtagFilterEvent('news_filter', 'NewsFilter', event_value);
        });

        // Send event when filters has been cleared.
        $('.filters', this).on('clear-filters-tracking', function (event, content_type) {
          var machine_name = getFiltersMachineName(content_type);
          var event_value = machine_name + ':CTA:clearfilters';

          emitUtagFilterEvent('news_filter', 'NewsFilter', event_value);
        });
      });
    }
  };

})(jQuery, Drupal);
