export default function AdTextInputs() {
  return (
    <>
      <label htmlFor="titleIn">Title</label>
          <input id="titleIn" type="text" placeholder="Title" />
          <label htmlFor="priceIn">Price</label>
          <input id="priceIn" type="number" placeholder="Price" />
          <label htmlFor="categoryIn">Category</label>
          <select name="" id="">
            <option selected disabled id="categoryIn" value="">
              Select category
            </option>
            <option value="">🚗 Vehicles</option>
            <option value="">🏠 Real Estate</option>
            <option value="">📱 Electronics</option>
            <option value="">🛋️ Home & Furniture</option>
            <option value="">👕 Fashion</option>
            <option value="">🧸 Kids</option>
            <option value="">🐾 Pets</option>
            <option value="">💼 Jobs & Services</option>
            <option value="">📦 Misc</option>
          </select>
          <label htmlFor="descriptionIn">Description</label>
          <textarea name="" id="descriptionIn" placeholder="description" />
          <label htmlFor="contactIn">Contact information</label>
          <textarea
            name=""
            id="contactIn"
            placeholder="mobile: +1 347 123 1234"
          />
    </>
  )
}