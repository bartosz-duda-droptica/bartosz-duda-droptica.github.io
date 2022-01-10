jQuery(function ($, Drupal) {

  var hasAjaxInstances = function () {
    return typeof Drupal.ajax !== "undefined" && typeof Drupal.ajax.instances !== "undefined";
  };

  $(document).ajaxStart(function () {
    if (!hasAjaxInstances()) {
      return;
    }
    for (var key in Drupal.ajax.instances) {
      Drupal.ajax.instances[key].progress = false;
    }
  });

  $(document).ajaxComplete(function () {
    if (!hasAjaxInstances()) {
      return;
    }
    // Remove the empty instances which causes unexpected dialog warnings.
    for (var key in Drupal.ajax.instances) {
      if (Drupal.ajax.instances[key] == null) {
        delete Drupal.ajax.instances[key];
      }
    }
  });

}(jQuery, Drupal));
