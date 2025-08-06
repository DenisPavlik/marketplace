"use server";

import Gallery from "@/components/Gallery";
import { connectToDB } from "@/libs/connectToDB";
import { AdModel } from "@/models/Ad";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

export default async function AdPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  await connectToDB();
  const adDoc = await AdModel.findById(id);
  if (!adDoc) {
    return 404;
  }

  return (
    <div className="flex absolute inset-0 top-18">
      <div className="max-w-4/6 grow bg-black text-white flex flex-col relative">
        <Link href={"/"} className="absolute top-4 left-4 z-20">
          <FontAwesomeIcon
            className="px-4 py-4 bg-gray-200/10 rounded-full text-xl
                  hover:bg-gray-200/50 duration-300 cursor-pointer"
            icon={faArrowLeft}
          />
        </Link>
        <Gallery files={adDoc.files} />
      </div>
      <div className="max-w-2/6 p-8 grow shrink-0">
        <h1 className="text-2xl font-semibold">{adDoc.title}</h1>
        <label>Price</label>
        <span className="text-xl font-semibold">${adDoc.price}</span>
        <label>Category</label>
        <span>{adDoc.category}</span>
        <label>Description</label>
        <span className="text-sm">{adDoc.description}</span>
        <label>Contact</label>
        <span>{adDoc.contact}</span>
      </div>
    </div>
  );
}
