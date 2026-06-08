import { withAssetBase } from "../../lib/assets.js";

export default function MobileCurrencyDisplay({ shopFunds = 0, gameFunds = 0 }) {
  return (
    <div className="mobile-profile-currency-row">
      <div className="mobile-page__currency-pill mobile-page__currency-pill--gold" style={{ justifyContent: "center" }}>
        <img src={withAssetBase("/icons/crown.svg")} className="h-[18px] w-[18px]" alt="" />
        <span>{Number(shopFunds).toLocaleString("ru-RU")}</span>
      </div>
      <div className="mobile-page__currency-pill mobile-page__currency-pill--purple" style={{ justifyContent: "center" }}>
        <img src={withAssetBase("/icons/rock.svg")} className="h-[18px] w-[18px]" alt="" />
        <span>{Number(gameFunds).toLocaleString("ru-RU")}</span>
      </div>
    </div>
  );
}