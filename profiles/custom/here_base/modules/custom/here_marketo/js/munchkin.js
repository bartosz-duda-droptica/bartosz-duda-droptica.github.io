/**
 * File with behaviors for marketo.
 */

(function ($, Drupal) {

  'use strict';

  /**
   * Behavior for marketo munchkin.
   */
  Drupal.behaviors.munchkin = {
    attach: function (context, settings) {
      // Only load Marketo Once.
      $(document).once('marketo').each(function () {
        // Only track Marketo if the setting is enabled.
        if (typeof settings.here_marketo_munchkin !== 'undefined' && settings.here_marketo_munchkin.track) {
          $.ajax({
            url: document.location.protocol + settings.here_marketo_munchkin.library,
            dataType: 'script',
            cache: true,
            success: function () {
              Munchkin.init(settings.here_marketo_munchkin.key, settings.here_marketo_munchkin.initParams);
              if (typeof settings.here_marketo_munchkin.actions !== 'undefined') {
                jQuery.each(settings.here_marketo_munchkin.actions, function () {
                  Drupal.behaviors.munchkin.marketoMunchkinFunction(this.action, this.data, this.hash);
                });
              }
            }
          });
        }
      });
    },
    marketoMunchkinFunction: function (actionType, data, hash) {
      Munchkin.munchkinFunction(actionType, data, hash);
    }
  };

})(jQuery, Drupal);
