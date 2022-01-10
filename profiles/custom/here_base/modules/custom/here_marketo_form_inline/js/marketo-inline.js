(function ($, Drupal) {

  var arrayFrom = Function.prototype.call.bind(Array.prototype.slice);

  /**
   * Emits view event from utag with given parameters.
   *
   * @param linkEvent
   *   Name of the event.
   * @param formAction
   *   The action made by the user either “form_opened” or “form_submitted”.
   * @param formCategory
   *   The value from the query string form_category. For example "contact-us".
   * @param formType
   *   Type of the form. For example ‘inline’ or ‘overlay’.
   */
  function emitUtagView(linkEvent, formAction, formCategory, formType) {
    if (typeof utag !== 'undefined' && utag !== null) {
      utag.view(
        {
          linkEvent: linkEvent,
          FormAction: formAction,
          FormCategory: formCategory,
          FormType: formType
        }
      );
    }
  }

  /**
   * Prepends tertiary CTA icon to the given element.
   *
   * @param theme
   *   CTA gradient theme.
   */
  function prependTertiaryIcon(theme) {
    var $this = $(this);
    if ($this.hasClass('modified')) {
      return;
    }

    $this.prepend(
      '<span class="cta__icon">' +
      '<svg role="img" title="cta-icon-tertiary" class="icon">' +
      '<use xlink:href="/themes/custom/here_com_theme/dist/img/sprite/sprite.svg?itok=8prfmwH6#cta-icon-tertiary"></use>' +
      '</svg></span>').addClass('cta modified');

    $this.closest('.mktoFormNotification').addClass('cta--' + theme + ' cta--tertiary');
  }

  /**
   * Sets paramaters to the url and pushes the state to the history.
   *
   * Updates the existing paramaters if needed and removes the hidden ones.
   *
   * @param {array} paramsList
   *   Associative array of parameters to set.
   * @param {array} allParamsList
   *   List of all parameters for the marketo form.
   *
   * TODO: Remove allParamsList parameter if all of the marketo inline nodes
   *   have the same parameters list.
   */
  function setParams(paramsList, allParamsList) {
    var params = new URLSearchParams(window.location.search);
    var paramsChanged = false;

    for (var key in paramsList) {
      if (params.get(key) !== paramsList[key]) {
        params.set(key, paramsList[key]);
        paramsChanged = true;
      }
    }

    for (var i = 0; i < allParamsList.length; i++) {
      if (!(allParamsList[i] in paramsList)) {
        params.delete(allParamsList[i]);
        paramsChanged = true;
      }
    }

    if (!paramsChanged) {
      return;
    }

    setUrl(params);
  }

  /**
   * Removes parameters from the url and pushes the state to the history.
   *
   * @param paramsList
   *   Array of parameter keys to remove.
   */
  function deleteParams(paramsList) {
    var params = new URLSearchParams(window.location.search);
    var paramsRemoved = true;

    for (var i = 0; i < paramsList.length; i++) {
      if (params.get(paramsList[i])) {
        paramsRemoved = false;
        params.delete(paramsList[i]);
      }
    }

    if (params.get('cta_id') || paramsRemoved) {
      return;
    }

    setUrl(params);
  }

  /**
   * Sets the url to the current one with additional parameters from the param.
   *
   * @param params
   *   Associative array of the new parameters.
   */
  function setUrl(params) {
    var paramsString = '';
    if (params.toString()) {
      paramsString = '?' + params.toString();
    }

    var newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + paramsString;
    window.history.pushState({path: newUrl}, '', newUrl);
  }

  Drupal.behaviors.marketoInline = {
    loaded: false,
    attach: function (context, settings) {
      if (typeof settings.marketo_form_field == 'undefined' || typeof settings.marketo_form_field.marketoForms === 'undefined' || settings.marketo_form_field.marketoForms.length === 0) {
        return;
      }

      // Prevent calling Marketo loadForm twice.
      if (this.loaded || $('.marketo-form-inline', context).length <= 0) {
        return;
      }

      var mktoFormConfig = {
        instanceHost: settings.marketo_form_field.instanceHost,
        munchkinId: settings.marketo_form_field.munchkinId,
      };

      var formCount = 0;
      var lastFocusedNodeId = 0;
      var lastFocusedFormCategory = '';

      /**
       * Check if the focus is on the marketo inline form or any of its child.
       *
       * If that's not the case, then remove all parameters related to the
       * marketo form.
       */
      function bindClickEvent() {
        $('body').once('marketo-inline-form-body-click-handler').click(function (e) {
          if ($(e.target).closest(".marketo-form-inline").length === 0) {
            deleteParams(settings.marketo_form_field.url_params_list);
            lastFocusedNodeId = 0;
          }
        });
      }

      $('.marketo-form-inline').each(function () {
        formCount++;
        var randomString = "_inline_" + formCount;
        var $originalFormId = $(this).data('marketo-id');
        var $nodeId = $(this).data('node-id');
        var newFormId = $originalFormId + randomString;

        $(this).find('form').attr('id', newFormId);

        var currentSettings = settings.marketo_form_field.marketoForms[$originalFormId][$nodeId];
        var $success = currentSettings.successHTML;

        $(this).find('.mtoForm-inline').focusin(function (e) {
          var focusedNodeId = $(e.target).closest('.marketo-form-inline').attr('data-node-id');

          // Emit utag 'form_opened' on inline form focus.
          if (lastFocusedNodeId === 0 || lastFocusedNodeId !== focusedNodeId) {
            lastFocusedNodeId = focusedNodeId;
            lastFocusedFormCategory = currentSettings['url_params']['form_category'];
            setParams(currentSettings['url_params'], settings.marketo_form_field.url_params_list);
            emitUtagView('form_detail', 'form_opened', currentSettings['url_params']['form_category'], 'inline');
          }
        });

        MktoForms2.loadForm(
          mktoFormConfig.instanceHost,
          mktoFormConfig.munchkinId,
          newFormId,
          function (form) {
            var $form = $('form#' + newFormId);

            form.render($form);
            form.setValues(currentSettings.values);
            var $parent = $('button[type="submit"]').parent();

            // Clear all button classes that break css styles.
            if ($parent.hasClass('mktoButtonWrap')) {
              $parent.attr('class', 'mktoButtonWrap');
            }

            // Add tertiary icon SVG to notification box.
            $form.find('.mktoFormNotification').each(function () {
              var $this = $(this);
              $this.find('a').each(function () {
                prependTertiaryIcon.call(this, currentSettings['formGradientTheme']);
              });

              $this.addClass('text-long modified');
            });

            // Add tertiary icon SVG to notification box on form change.
            $form.change(function () {
              $form.find('.mktoFormNotification').each(function () {
                var $this = $(this);
                $this.find('a').each(function () {
                  prependTertiaryIcon.call(this, currentSettings['formGradientTheme']);
                });

                $this.addClass('text-long modified');
              });
            });

            form.onSuccess(function () {
              var $form = $('form#' + newFormId);
              var $marketoInline = $form.closest('.marketo-form-inline[data-marketo-id="' + $originalFormId + '"]');
              var $successSelector = $marketoInline;
              var headerHeight = parseInt($('.layout-container').css('padding-top'));

              $marketoInline.addClass('form-succeed');

              if ($form.parents('.marketo-form-inline--form-type--two-col-with-img').length > 0) {
                var $formWrapper = $form.closest('.marketo-form-inline__form-wrapper');
                $successSelector = $formWrapper.find('.marketo-form-inline__form-success');
                $successSelector.removeClass('d-none');
                $formWrapper.find('.marketo-form-inline__form-content').addClass('d-none');
              }
              else {
                form.getFormElem().hide();
              }

              $successSelector.html($success);

              emitUtagView('form_detail', 'form_submitted', currentSettings['url_params']['form_category'], 'inline');

              window.scrollTo(0, ($marketoInline.offset().top) - headerHeight);
              $('.cta--marketo-reload').click(function () {
                location.reload();
              });
              return false;
            });
          });
      }).promise().done(function () {
        bindClickEvent();
      });

      var count = 0;
      MktoForms2.whenRendered(function (form) {
        var formEl = form.getFormElem()[0];
        arrayFrom(formEl.querySelectorAll("label[for]")).forEach(function (labelEl) {
          var forEl = formEl.querySelector('[id="' + labelEl.htmlFor + '"]');
          if (forEl) {
            labelEl.htmlFor = forEl.id = forEl.id + '_' + count++;
          }
        });
        // Remove duplicate ID.
        var $mktoStyleLoaded = $('#mktoStyleLoaded');
        if ($mktoStyleLoaded.length) {
          $mktoStyleLoaded.remove();
        }
      });

      MktoForms2.whenReady(function (form) {
        var $form = form.getFormElem();

        // Remove the external stylesheets.
        var links = window.document.getElementsByTagName('link');
        $(links).each(function () {
          var thisLinkElement = $(this);
          var thisLinkURL = thisLinkElement.attr('href');
          if (thisLinkURL.indexOf('marketo.com') > 1 || thisLinkURL.indexOf('website.webforms-here.com') > 1) {
            thisLinkElement.remove();
          }
        });
        // And the inline styles.
        $form.find('style').remove();
        // And the style attributes.
        $form.find('[style]').removeAttr('style');

        // Remove custom form styles.
        $('head').find('style').each(function () {
          var $this = $(this);
          if ($this.text().indexOf('mktoForm') > 0) {
            $this.remove();
          }
        });

        // Add classes to checkboxes.
        $form.find('.mktoCheckboxList').each(function () {
          var $this = $(this);
          if ($this.find('input').length === 1) {
            return;
          }

          $this.find('label').addClass('multiple');
        });

        // Hide empty labels.
        $form.find('label').each(function () {
          var $this = $(this);
          if ($this.text() === '*') {
            $this.addClass('empty-label');
          }
        });

        // Button styling.
        var $button = $form.find('.mktoButton');
        var ctaTypeClass = 'cta--secondary cta--button';
        var $marketoFormInline = $form.closest('.marketo-form-inline');

        if ($marketoFormInline.hasClass('marketo-form-inline--form-type--two-col-with-img') && $marketoFormInline.length > 0) {
          var buttonText = $button.text();
          $button.html('<span class="cta__content">' + buttonText + '</span>');

          var ctaGradientClass = $marketoFormInline.hasClass('marketo-gradient-theme-developer') ? 'cta--developer' : 'cta--core';
          ctaTypeClass = 'cta--primary ' + ctaGradientClass;
        }

        $button.addClass('cta ' + ctaTypeClass + ' cta--with-label cta--size-big');

        $form.addClass('ready');
      });

      this.loaded = true;
    }
  };

}(jQuery, Drupal));
