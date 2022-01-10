jQuery(function ($, Drupal, drupalSettings) {
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

  Drupal.behaviors.marketo = {
    loaded: false,
    attach: function (context, settings) {

      if (typeof settings.marketo_form_field == 'undefined' || typeof settings.marketo_form_field.marketoForms === 'undefined' || settings.marketo_form_field.marketoForms.length === 0) {
        return;
      }

      if ($('.cta--marketo', context).length <= 0) {
        return;
      }

      var mktoFormConfig = {
        instanceHost: settings.marketo_form_field.instanceHost,
        munchkinId: settings.marketo_form_field.munchkinId,
      };

      $('.cta--marketo', context).once('marketo').each(function () {
        $(this).click(function (event) {
          event.preventDefault();
          var $self = $(this);
          var randomString = "_popup";
          var $originalFormId = $(this).data('marketo-id');
          var $paragraphId = $(this).data('paragraph-id');
          var newFormId = $originalFormId + randomString;
          var currentSettings = settings.marketo_form_field.marketoForms[$originalFormId][$paragraphId];
          var ctaState = {
            item: $self,
            class: 'disabled',
            disable: function () {
              this.item.addClass(this.class);
            },
            enable: function () {
              this.item.removeClass(this.class);
            },
            isDisabled: function () {
              return this.item.hasClass(this.class);
            }
          };
          var $desc = $("<div class='description col-xs-12 col-sm-12 col-md-12 offset-lg-1 col-lg-4'>" +
            '<div class="mktoModal__image">' + currentSettings.formImage + '</div>' +
            '<h' + currentSettings.formTitleHeading + ' class="heading">' +
            currentSettings.formTitle +
            '</h' + currentSettings.formTitleHeading + '>' +
            '<div class="text-long text-long--lg-font">' + currentSettings.formDesc + '</div>' +
            "</div>");
          var $success = currentSettings.successHTML;

          var changeBizibleUrl = function (action) {
            var form_id = $self.data('bizible');
            var newurl = window.location.protocol +
              "//" + window.location.host +
              window.location.pathname;
            if (action == "add") {
              newurl += '?' + form_id;
              window.history.pushState({path: newurl}, '', newurl);
            }
            else {
              window.history.back();
            }
          };

          if (ctaState.isDisabled()) {
            return false;
          }

          ctaState.disable();

          MktoForms2.loadForm(
            mktoFormConfig.instanceHost,
            mktoFormConfig.munchkinId,
            $originalFormId,
            function (form) {
              if (typeof form === "undefined" || form === null) {
                return;
              }

              Drupal.noScroll.on();
              changeBizibleUrl('add');
              form.setValues(currentSettings.values);
              emitUtagView('form_detail', 'form_opened', currentSettings.formCategory, 'overlay');

              form.onSuccess(function () {
                return false;
              });

              var hideLightbox = function () {
                // Block possibility of calling hideLightbox function multiple times.
                if (!$('html').hasClass('no-scroll')) {
                  return;
                }

                lightbox.hide();
                Drupal.noScroll.off();
                changeBizibleUrl('remove');
                ctaState.enable();
                // Remove duplicate ID.
                var $mktoStyleLoaded = $('#mktoStyleLoaded');
                if ($mktoStyleLoaded.length) {
                  $mktoStyleLoaded.remove();
                }
                // Marketo adds an empty form tag at the bottom of the page when lightbox opens.
                // Remove only last one because it was added when opening the lightbox.
                $('body > form.mktoForm').last().remove();

                $(document).off('keyup', closeLightboxOnEscape);
              };

              var lightbox = MktoForms2.lightbox(form, {
                onSuccess: function () {
                  $('.mktoModal').scrollTop(0);
                  $('.mktoModalMain').empty().append($success);
                  $('.marketo-success-content .cta').on('click', function (event) {
                    var ctaHref = $(this).attr('href');
                    if (ctaHref === '#' || ctaHref === '') {
                      event.preventDefault();
                      hideLightbox();
                    }
                  });

                  emitUtagView('form_detail', 'form_submitted', currentSettings.formCategory, 'overlay');
                }
              }).show();

              var closeLightboxOnEscape = function (e) {
                if (e.which === 27) {
                  hideLightbox();
                }
              };
              $(document).keyup(closeLightboxOnEscape);

              // Hide modal window on click on background.
              $('.mktoModal').on('click', function (event) {
                if ($(event.target).find('.mktoModalMask').length) {
                  hideLightbox();
                }
              });

              $('.mktoModalClose').on('click', function () {
                hideLightbox();
              });
              $('.mktoModal form').wrap("<div class='form col-xs-12 col-sm-12 col-md-12 offset-lg-1 col-lg-5'></div>");
              $('.mktoModalClose').html('');
              $('.mktoModalMain')
                .addClass('mktoModalMain--' + currentSettings.formTheme)
                .prepend($desc)
                .wrapInner("<div class='mktoModalMain__inner-wrapper row'></div>");

              if (currentSettings.formInlineStyles && typeof currentSettings.formInlineStyles === 'object') {
                $('.mktoModalContent').css(currentSettings.formInlineStyles);
              }

              $('.mktoModalContent').addClass('container' + ' ' + currentSettings.formClasses);

              var $submitButton = $('.mktoModalContent').find('button[type="submit"]');
              var $parent = $submitButton.parent();

              $submitButton.addClass('cta cta--secondary cta--button');

              // Clear all button classes that break css styles.
              if ($parent.hasClass('mktoButtonWrap')) {
                $parent.attr('class', 'mktoButtonWrap');
              }
            });

          var count = 0;
          MktoForms2.whenRendered(function (form) {
            $('.mktoModalMain').find('#mktoForm_' + $originalFormId).attr('id', newFormId);
            var formEl = form.getFormElem()[0];
            arrayFrom(formEl.querySelectorAll("label[for]")).forEach(function (labelEl) {
              var forEl = formEl.querySelector('[id="' + labelEl.htmlFor + '"]');
              if (forEl) {
                labelEl.htmlFor = forEl.id = forEl.id + '_' + count++;
              }
            });
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

            $form.addClass('ready');
          });
        });
      });
    }
  };

  $(window).on('load', function () {
    if ($('.mktoModal').length > 0) {
      return;
    }

    $('[data-bizible]').each(function () {
      var bizible = '?' + $(this).data('bizible');
      var search = window.location.search;
      if (bizible === search) {
        $(this).trigger('click');
      }
    });
  });

}(jQuery, Drupal, drupalSettings));
