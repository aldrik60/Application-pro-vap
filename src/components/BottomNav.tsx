import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Award, BookOpen, User, Activity, Settings } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function BottomNav() {
  const { profile } = useAuth()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1A1A1E] border-t border-[#2E2E32] flex justify-around items-center px-2 py-3 z-50">
      <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-[#B8482A]' : 'text-[#686868]'}`}>
        <Home size={24} />
        <span className="text-[10px] font-medium">Accueil</span>
      </NavLink>
      <NavLink to="/badges" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-[#B8482A]' : 'text-[#686868]'}`}>
        <Award size={24} />
        <span className="text-[10px] font-medium">Badges</span>
      </NavLink>
      <NavLink to="/contenu" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-[#B8482A]' : 'text-[#686868]'}`}>
        <BookOpen size={24} />
        <span className="text-[10px] font-medium">Contenu</span>
      </NavLink>
      <NavLink to="/parcours" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-[#B8482A]' : 'text-[#686868]'}`}>
        <Activity size={24} />
        <span className="text-[10px] font-medium">Parcours</span>
      </NavLink>
      <NavLink to="/profil" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-[#B8482A]' : 'text-[#686868]'}`}>
        <User size={24} />
        <span className="text-[10px] font-medium">Profil</span>
      </NavLink>
      
      {profile?.role === 'admin' && (
        <NavLink to="/admin" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-[#CB8002]' : 'text-[#686868]'}`}>
          <Settings size={24} />
          <span className="text-[10px] font-medium">Admin</span>
        </NavLink>
      )}
    </nav>
  )
}
