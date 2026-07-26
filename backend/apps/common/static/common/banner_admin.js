document.addEventListener("DOMContentLoaded", function () {
  const picker = document.getElementById("id_deals_category");
  const linkInput = document.getElementById("id_link_url");
  if (!picker || !linkInput) return;

  picker.addEventListener("change", function () {
    if (picker.value) {
      linkInput.value = "/deals/" + picker.value;
    }
  });
});
