'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PawPrint, Plus, Trash2, Edit2, RefreshCw, QrCode, Share2, Copy, Download, X, Lock } from 'lucide-react';
import PetProfileCard from '@/components/PetProfileCard';
import PetProfileModal, { PetFormData } from '@/components/PetProfileModal';

export default function AccountPetsTab({ 
  ownerEmail
}: { 
  ownerEmail: string;
  forcedTab?: string;
}) {
  const [pets, setPets] = useState<PetFormData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit modal state
  const [editingPet, setEditingPet] = useState<PetFormData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [qrPet, setQrPet] = useState<PetFormData | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchPets = async () => {
    if (!ownerEmail) return;
    setLoading(true);
    try {
      const petsRes = await fetch(`/api/petsitting/pets?email=${encodeURIComponent(ownerEmail)}`);
      if (petsRes.ok) {
        const pData = await petsRes.json();
        setPets(pData.pets || []);
      }
    } catch (err) {
      console.error('Failed to load pets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, [ownerEmail]);

  const handleOpenAdd = () => {
    setEditingPet(null);
    setShowModal(true);
  };

  const handleDeletePet = async (petId: string) => {
    if (!confirm('Are you sure you want to delete this pet profile?')) return;
    try {
      const res = await fetch(`/api/petsitting/pets?id=${petId}&email=${encodeURIComponent(ownerEmail)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchPets();
      }
    } catch (ex) {
      alert('Error deleting pet');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {loading ? (
        <div className="flex flex-col items-center py-10 gap-2">
          <RefreshCw className="w-6 h-6 text-[#8B5E3C] animate-spin" />
          <p className="text-xs text-gray-500 font-medium">Loading pet profile details...</p>
        </div>
      ) : (
        /* ── REGISTERED PETS LIST ── */
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-[#191919] text-base">Registered Pets</h3>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3.5 py-2 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer btn-gloss"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Pet
            </button>
          </div>

          {pets.length === 0 ? (
            <div className="text-center py-10 px-4 bg-[#FAF7F2] rounded-2xl border border-dashed border-[#EAE3D9] flex flex-col items-center gap-2">
              <PawPrint className="w-8 h-8 text-amber-700/40" />
              <p className="font-bold text-gray-800 text-sm">No pets registered yet</p>
              <p className="text-xs text-gray-500 max-w-xs">Add your pet once to use seamlessly across Pet Sitting, Vet Boarding, and Daycare.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pets.map(pet => (
                <PetProfileCard
                  key={pet.id}
                  pet={pet}
                  tier="owner"
                  collapsible={true}
                  defaultExpanded={false}
                  actions={
                    <>
                      <button
                        type="button"
                        onClick={() => { setQrPet(pet); setCopiedLink(false); }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer btn-gloss"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-600" /> Partner QR
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingPet(pet); setShowModal(true); }}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer btn-gloss"
                      >
                        <Edit2 className="w-3 h-3 text-gray-500" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => pet.id && handleDeletePet(pet.id)}
                        className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CANONICAL EDIT / ADD PET MODAL ── */}
      <PetProfileModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingPet(null);
        }}
        ownerEmail={ownerEmail}
        initialPet={editingPet}
        onSaved={() => {
          fetchPets();
        }}
      />

      {/* ── PARTNER QR CODE MODAL ── */}
      {qrPet && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            style={{ boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.25)' }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-[#EADBCE] text-center relative flex flex-col items-center gap-4"
          >
            <button
              type="button"
              onClick={() => setQrPet(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-extrabold text-[#191919] text-lg">Partner Check-In QR</h3>
              <p className="text-xs text-gray-500 mt-1">
                Show this QR code to your Vet Clinic, Daycare, or Sitter to instantly grant secure check-in access for <strong className="text-gray-700">{qrPet.pet_name}</strong>.
              </p>
            </div>

            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-gray-200 shadow-inner flex flex-col items-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`https://lumobites.net/pet-access?id=${qrPet.id}`)}`}
                alt="Pet Access QR"
                className="w-48 h-48 rounded-xl shadow-xs"
              />
              <span className="text-[10px] text-gray-500 font-mono mt-2 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" /> End-to-End Secure Check-In
              </span>
            </div>

            <div className="flex items-center gap-2 w-full pt-1">
              <button
                type="button"
                onClick={() => {
                  const link = `https://lumobites.net/pet-access?id=${qrPet.id}`;
                  navigator.clipboard.writeText(link);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedLink ? (
                  <>✓ Copied Link</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Copy Link</>
                )}
              </button>

              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`https://lumobites.net/pet-access?id=${qrPet.id}`)}`}
                download={`${qrPet.pet_name}-checkin-qr.png`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3.5 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs no-underline cursor-pointer btn-gloss"
              >
                <Download className="w-3.5 h-3.5" /> Save
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
