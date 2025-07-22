"use client";

import {
  faPlus,
  faPlusCircle,
  faRightFromBracket,
  faRightToBracket,
  faStore,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function Header({ session }: { session: Session | null }) {
  return (
    <header
      className="p-4 border-b border-gray-200 flex items-center
    justify-between"
    >
      <Link
        className="text-emerald-600 font-bold text-2xl
      flex items-center gap-2"
        href={"/"}
      >
        <FontAwesomeIcon className="text-3xl" icon={faStore} />
        Marketplace
      </Link>
      <div className="hidden sm:flex items-center gap-1">
        <button
          className="border-emerald-600 text-emerald-600 cursor-pointer
        inline-flex items-center justify-center rounded-sm gap-1 px-2 py-1 border mr-4
        hover:bg-emerald-600 hover:text-white duration-300"
        >
          <FontAwesomeIcon className="text-md" icon={faPlus} />
          <span>Post an add</span>
        </button>
        <span className="border-r text-gray-200 mr-3">&nbsp;</span>
        <div className="flex gap-4">
          {session?.user ? (
            <>
              {/* <button
                className="bg-emerald-600 rounded-sm text-white border border-emerald-600
          px-6 py-1 cursor-pointer hover:bg-white hover:text-emerald-600 duration-300"
                onClick={() => signOut()}
              >
                Sign Out
              </button> */}
              <Link href={"/account"}>
                <Image
                  src={
                    session.user.image || session.user.name?.charAt(0) || "U"
                  }
                  alt="avatar"
                  width={40}
                  height={40}
                  className="rounded-md"
                />
              </Link>
            </>
          ) : (
            <>
              <button
                className="bg-emerald-600 rounded-sm text-white border border-emerald-600
                px-6 py-1 cursor-pointer hover:bg-white hover:text-emerald-600 duration-300"
                onClick={() => signIn("google")}
              >
                Login with Google
              </button>
            </>
          )}
        </div>
      </div>
      <div className="flex sm:hidden items-center gap-4">
        <button>
          <FontAwesomeIcon
            icon={faPlusCircle}
            className="text-2xl text-emerald-600"
          />
        </button>
        {session?.user ? (
          // <button onClick={() => signOut()}>
          //   <FontAwesomeIcon
          //     icon={faRightFromBracket}
          //     className="text-2xl text-emerald-600"
          //   />
          // </button>
          <Link href={"/account"}>
            <Image
              src={session.user.image || session.user.name?.charAt(0) || "U"}
              alt="avatar"
              width={40}
              height={40}
              className="rounded-md"
            />
          </Link>
        ) : (
          <button onClick={() => signIn("google")}>
            <FontAwesomeIcon
              icon={faRightToBracket}
              className="text-2xl text-emerald-600"
            />
          </button>
        )}
      </div>
    </header>
  );
}
