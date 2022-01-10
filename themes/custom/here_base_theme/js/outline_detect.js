jQuery(function ($, Drupal) {

  /**
   * Add class to body depending on user interaction.
   */
  Drupal.behaviors.outlineDetect = {
    attach: function (context, settings) {
      $('body').bind('mousedown', function () {
        $(this).addClass('using-mouse');
      }).bind('keydown', function () {
        $(this).removeClass('using-mouse');
      });
    }
  };

}(jQuery, Drupal));
