import { categories } from "@/libs/helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function AdTextInputs() {
  return (
    <>
      <label htmlFor="titleIn">Title</label>
      <input name="title" id="titleIn" type="text" placeholder="Title" required />
      <label htmlFor="priceIn">Price (USD)</label>
      <input name="price" id="priceIn" type="number" placeholder="Price" required />
      <label htmlFor="categoryIn">Category</label>
      <select name="category" id="categoryIn" defaultValue="0" required>
        <option disabled value="0">
          Select category
        </option>
        {categories.map(({key, label}) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
      <label htmlFor="descriptionIn">Description</label>
      <textarea name="description" id="descriptionIn" placeholder="description" />
      <label htmlFor="contactIn">Contact information</label>
      <textarea name="contact" id="contactIn" placeholder="mobile: +1 347 123 1234" required />
    </>
  );
}
