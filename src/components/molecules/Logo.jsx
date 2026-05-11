import LogoWord from "../atoms/Logo.jsx";
import { buildAppHref } from "../../shared/router/buildAppHref.js";

export default function Logo() {
  return (
    <a href={buildAppHref("/")} className="block w-[168px] no-underline">
      <LogoWord>Pawn</LogoWord>
      <LogoWord>Requiem</LogoWord>
    </a>
  );
}
