// Claim page: shows the item in ?id= (from ../js/item-store.js) next to the form, saves the claim
// (../js/claim-store.js, reviewed on ../admin/claims.html) and swaps the form for a confirmation.
// TODO: send the claim to the backend instead of the demo store.

const claimForm = document.querySelector("#claim-form");
const claimSuccess = document.querySelector("#claim-success");

// Old links without ?id= show the newest item, like the item details page.
const claimId = new URLSearchParams(window.location.search).get("id");
const claimItem = claimId ? ItemStore.get(claimId) : ItemStore.available()[0];

if (claimItem) {
  const detailsLink = `item-details.html?id=${encodeURIComponent(claimItem.id)}`;
  document.title = `FindIt | Claim ${claimItem.name}`;
  document.querySelector("#crumb-item").textContent = claimItem.name;
  document.querySelector("#crumb-item").href = detailsLink;
  document.querySelector("#claim-cancel").href = detailsLink;
  document.querySelector("#summary-heading").textContent = claimItem.name;
  document.querySelector("#summary-ref").textContent = claimItem.id;
  document.querySelector("#summary-found").textContent = Locations.label(claimItem.locationId, claimItem.locationOther);
  if (claimItem.image) document.querySelector("#summary-img").src = claimItem.image;

  const date = document.querySelector("#summary-date");
  date.dateTime = claimItem.dateFound;
  date.textContent = new Date(`${claimItem.dateFound}T00:00:00`)
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

claimForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const field = (name) => claimForm.elements[name].value.trim();
  const claim = ClaimStore.add({
    itemId: claimItem ? claimItem.id : claimId,
    account: Auth.getSession()?.email || null,
    claimant: { name: field("fullName"), schoolId: field("schoolId"), email: field("email"), phone: field("phone") },
    brand: field("brand"),
    identifiers: field("identifiers"),
    lostLocation: field("lostLocation"),
    lostDate: field("lostDate"),
    proofFiles: [...claimForm.elements.proof.files].map((file) => file.name),
  });
  document.querySelector("#track-claim").href = `my-reports.html?id=${encodeURIComponent(claim.id)}`;
  claimForm.hidden = true;
  claimSuccess.hidden = false;
  claimSuccess.focus();
});
