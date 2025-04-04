  {/* Sign Out button at the bottom */}
  <div className="flex items-center justify-center p-2 w-full mt-auto">
    <Button 
      onClick={onSignOut} 
      variant="ghost" 
      className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white w-full justify-start"
    >
      <LogOut className="h-5 w-5 mr-2" />
      <span>Sign Out</span>
    </Button>
  </div> 