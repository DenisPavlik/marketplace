"use client";

import {
  faPlus,
  faPlusCircle,
  faRightToBracket,
  faStore,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Session } from "next-auth";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function Header({ session }: { session: Session | null }) {
  return (
    <header
      className="p-4 border-b border-gray-200 flex items-center
    justify-between h-18"
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
        <Link
          href={"/new"}
          className="outlineBtn inline-flex items-center justify-center gap-1 mr-4"
        >
          <FontAwesomeIcon className="text-md" icon={faPlus} />
          <span>Post an ad</span>
        </Link>
        <span className="border-r text-gray-200 mr-3">&nbsp;</span>
        <div className="flex gap-4">
          {session?.user ? (
            <>
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
              <button className="solidBtn" onClick={() => signIn("google")}>
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
