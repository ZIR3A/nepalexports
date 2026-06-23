$pages = @("shop", "product", "cart", "checkout", "account", "tracking", "admin", "auth", "wishlist", "flash-sale", "about")
foreach ($p in $pages) {
  New-Item -Path "src/app/$p" -ItemType "directory" -Force
  
  $componentName = ""
  if ($p -eq "shop") { $componentName = "ShopPage" }
  elseif ($p -eq "product") { $componentName = "ProductDetailPage" }
  elseif ($p -eq "cart") { $componentName = "CartPage" }
  elseif ($p -eq "checkout") { $componentName = "CheckoutPage" }
  elseif ($p -eq "account") { $componentName = "AccountDashboard" }
  elseif ($p -eq "tracking") { $componentName = "OrderTracking" }
  elseif ($p -eq "admin") { $componentName = "AdminDashboard" }
  elseif ($p -eq "auth") { $componentName = "AuthPage" }
  elseif ($p -eq "wishlist") { $componentName = "WishlistPage" }
  elseif ($p -eq "flash-sale") { $componentName = "FlashSalePage" }
  elseif ($p -eq "about") { $componentName = "AboutPage" }

  $content = @"
"use client";
import $componentName from "@/components/pages/$componentName";
import { useAppContext } from "@/context/AppContext";

export default function Page() {
  const props = useAppContext();
  return <$componentName {...props} />;
}
"@
  Set-Content -Path "src/app/$p/page.js" -Value $content
}

$homeContent = @"
"use client";
import HomePage from "@/components/pages/HomePage";
import { useAppContext } from "@/context/AppContext";

export default function Page() {
  const props = useAppContext();
  return <HomePage {...props} />;
}
"@
Set-Content -Path "src/app/page.js" -Value $homeContent

