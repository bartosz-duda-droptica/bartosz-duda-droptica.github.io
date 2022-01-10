/**
 * @file
 * Behaviors for HERE Language Switcher.
 */

(function ($, Drupal) {

  /**
   * HERE Language Switcher general behavior.
   */
  Drupal.behaviors.hereLanguageSwitcher = {
    attach: function (context) {
      $('.language-switcher', context).once('language-switcher').each(function () {
        var $languageSwitcher = $(this);
        $languageSwitcher.find('.language-switcher__current-language a').click(function (e) {
          e.preventDefault();
          $languageSwitcher.toggleClass('open');
        });
      });
    }
  };

})(jQuery, Drupal);
