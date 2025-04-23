import KategoriRoutes from "./Kategori";
import PengaduanRoutes from "./Pengaduan";
import PengaduanMasyarakatRoutes from "./PengaduanMasyarakat";
import unitRoutes from "./unit";
import UploadRoutes from "./Upload";
import UserRoutes from "./User";
import KategoriWBSRoutes from "./KategoriWBS";
import PelaporanWBSRoutes from "./PelaporanWBS";

import NotificationRoutes from "./Notification";
import UserLevelsRoutes from "./UserLevels";
import AclRoutes from "./Acl";

const RoutesRegistry = {
  UserRoutes,
  PengaduanRoutes,
  KategoriRoutes,
  unitRoutes,
  PengaduanMasyarakatRoutes,
  UploadRoutes,
  KategoriWBSRoutes,
  PelaporanWBSRoutes,
  NotificationRoutes,
  AclRoutes,
  UserLevelsRoutes,
};

export default RoutesRegistry;
