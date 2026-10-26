import { hydrateRoot } from "react-dom/client";
import { PublicSite } from "./PublicSite";
import { publicRoute } from "../shared/seo";
import "./styles.css";

const route = publicRoute(location.pathname);
if (route) hydrateRoot(document.getElementById("root")!, <PublicSite {...route} />);
