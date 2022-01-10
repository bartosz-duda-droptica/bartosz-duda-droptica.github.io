jQuery(function ($, Drupal) {
  Drupal.behaviors.multiLinks = {
    attach: function (context, settings) {
      var $wrapper = $('.multi-cta');

      $wrapper.once('multi-links').each(function () {
        var $this = $(this);
        var $imgWrapper = $this.find('img').first().parent();

        $this.find('.cta').each(function () {
          $(this).hover(
            function () {
              $imgWrapper.addClass('zooming-image-hover');
            },
            function () {
              $imgWrapper.removeClass('zooming-image-hover');
            }
          );
        });
      });
    },
  };
}(jQuery, Drupal));
