// Auto-check the "Add X" checkboxes of optional object widgets so their
// fields are always visible, then hide the checkboxes via CSS (custom.css).
// The widgets stay optional in the schema — empty objects are simply not saved.
(function () {
  function checkOptionalObjects() {
    document
      .querySelectorAll('.sui.checkbox input[type="checkbox"]:not(:checked)')
      .forEach(function (input) {
        var label = input.closest('.sui.checkbox');
        if (label && /^(Aggiungi|Add)\b/i.test(label.textContent.trim())) {
          input.click();
        }
      });
  }

  new MutationObserver(checkOptionalObjects).observe(document.body, {
    childList: true,
    subtree: true,
  });

  document.addEventListener('DOMContentLoaded', checkOptionalObjects);
})();
