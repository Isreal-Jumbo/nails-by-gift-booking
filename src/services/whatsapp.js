const giftWhatsAppNumber = "2349013814632";

export function createWhatsAppLink(
  message = "Hi Gift, I would like to book a nail appointment.",
) {
  return `https://wa.me/${giftWhatsAppNumber}?text=${encodeURIComponent(message)}`;
}
