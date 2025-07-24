
import { FC } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Phone, FileText, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SidebarProps {
  currentPath: string;
}

const Sidebar: FC<SidebarProps> = ({
  currentPath
}) => {
  const { logout } = useAuth();

  const menuItems = [{
    name: "Dashboard",
    path: "/",
    icon: <LayoutDashboard className="h-5 w-5" />
  }, {
    name: "Campaigns",
    path: "/campaigns",
    icon: <Phone className="h-5 w-5" />
  }, {
    name: "Billing",
    path: "/billing",
    icon: <FileText className="h-5 w-5" />
  }];

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  return (
    <div className="hidden md:flex flex-col h-screen w-56 border-r bg-white">
      <div className="flex items-center h-16 px-4 border-b">
        <div className="flex items-center space-x-2">
          <img src="/lovable-uploads/620a3236-a743-4779-8cde-07f0a587c6ed.png" alt="Conversion Media Logo" className="h-8" />
          <h1 className="text-sm font-semibold">Conversion Media Group</h1>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-4">
        <div className="text-sm font-medium text-muted-foreground mb-2">Management</div>
        <nav className="flex flex-col space-y-1 flex-1">
          {menuItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex items-center h-10 px-4 py-2 text-sm rounded-md ${
                currentPath === item.path 
                  ? "bg-muted text-primary font-medium" 
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
        
        <div className="mt-auto pt-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:bg-muted"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
