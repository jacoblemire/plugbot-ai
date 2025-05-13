// checkout.js
let stripe, elements;

async function initialize() {
  const response = await fetch("https://YOUR-BACKEND-URL/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const { clientSecret } = await response.json();

  stripe = Stripe("pk_live_YOUR_PUBLISHABLE_KEY"); // Replace with your real publishable key

  elements = stripe.elements({ clientSecret });

  const paymentElement = elements.create("payment");
  paymentElement.mount("#payment-element");
}

async function handleSubmit(e) {
  e.preventDefault();
  document.querySelector("#submit").disabled = true;

  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: "https://plugbot.mxdenterprises.com/success.html",
    },
  });

  if (error) {
    const messageContainer = document.querySelector("#error-message");
    messageContainer.textContent = error.message;
    document.querySelector("#submit").disabled = false;
  }
}

document.querySelector("#payment-form").addEventListener("submit", handleSubmit);
initialize();
