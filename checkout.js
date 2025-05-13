let stripe, elements;

async function initialize() {
  const response = await fetch("https://plugbot-api.onrender.com/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const { clientSecret } = await response.json();

  stripe = Stripe("pk_live_YOUR_REAL_PUBLISHABLE_KEY"); // Replace this

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

document.addEventListener("DOMContentLoaded", () => {
  initialize();
  document.querySelector("#payment-form").addEventListener("submit", handleSubmit);
});
