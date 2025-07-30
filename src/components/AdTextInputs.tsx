export default function AdTextInputs() {
  return (
    <>
      <label htmlFor="titleIn">Title</label>
      <input id="titleIn" type="text" placeholder="Title" />
      <label htmlFor="priceIn">Price</label>
      <input id="priceIn" type="number" placeholder="Price" />
      <label htmlFor="categoryIn">Category</label>
      <select name="" id="categoryIn" defaultValue="0">
        <option disabled value="0">
          Select category
        </option>
        <option value="vehicles">🚗 Vehicles</option>
        <option value="real-estate">🏠 Real Estate</option>
        <option value="electronics">📱 Electronics</option>
        <option value="home">🛋️ Home & Furniture</option>
        <option value="fashion">👕 Fashion</option>
        <option value="kids">🧸 Kids</option>
        <option value="pets">🐾 Pets</option>
        <option value="jobs">💼 Jobs & Services</option>
        <option value="misc">📦 Misc</option>
      </select>
      <label htmlFor="descriptionIn">Description</label>
      <textarea name="" id="descriptionIn" placeholder="description" />
      <label htmlFor="contactIn">Contact information</label>
      <textarea name="" id="contactIn" placeholder="mobile: +1 347 123 1234" />
    </>
  );
}
