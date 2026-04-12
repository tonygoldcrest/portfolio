import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-foreground w-5/6 m-auto flex flex-col">
      <NavigationMenu className="grow-0">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              href="#hero"
              className={navigationMenuTriggerStyle()}
            >
              Summary
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              href="#experience"
              className={navigationMenuTriggerStyle()}
            >
              Experience
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              href="#projects"
              className={navigationMenuTriggerStyle()}
            >
              Projects
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      {children}
    </div>
  );
}
