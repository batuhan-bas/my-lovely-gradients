import { defineStore } from "pinia";

// --- Tipler ---
export type DbGradient = {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  tags: string[];
  angle: number;
  colors: string[];
  is_system: boolean;
  created_at: string;
  updated_at: string;
};

export type Gradient = {
  id: string;
  name: string;
  desc: string;
  tags: string[];
  angle: number;
  colors: string[];
  isSystem: boolean;
  isOwner: boolean;
  ownerId?: string | null;
  ownerName?: string | null;
};

export type GradientInput = {
  name: string;
  desc: string;
  tags: string[];
  angle: number;
  colors: string[];
};

export const useGradients = defineStore("gradients", () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  // --- 1. Merkezi ID ve Rol Yönetimi ---
  const currentUserId = computed(
    () => user.value?.id || user.value?.sub || null
  );

  const isAdmin = computed(() => {
    return user.value?.app_metadata?.is_admin === true;
  });

  // --- 2. State ---
  const systemGradients = ref<Gradient[]>([]);
  const userGradients = ref<Gradient[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Cache for user profiles (userId -> name)
  const userProfiles = ref<Record<string, string>>({});

  const items = computed(() => [
    ...systemGradients.value,
    ...userGradients.value,
  ]);

  // --- 3. Yardımcı Fonksiyonlar ---
  function getOwnerName(userId: string | null): string | null {
    if (!userId) return null;
    // Current user's name
    if (userId === currentUserId.value) {
      return user.value?.user_metadata?.full_name || null;
    }
    // Cached profile name
    return userProfiles.value[userId] || null;
  }

  function transformGradient(db: DbGradient): Gradient {
    // isOwner: Kullanici login olmali VE gradient'in sahibi olmali
    const isOwner = !!(
      currentUserId.value &&
      db.user_id &&
      db.user_id === currentUserId.value
    );

    return {
      id: db.id,
      name: db.name,
      desc: db.description || "",
      tags: db.tags || [],
      angle: db.angle,
      colors: db.colors,
      isSystem: db.is_system,
      isOwner,
      ownerId: db.user_id,
      ownerName: getOwnerName(db.user_id),
    };
  }

  // Fetch user profiles for admin view
  async function fetchUserProfiles(userIds: string[]) {
    if (userIds.length === 0) return;
    try {
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profileError) {
        // Profiles table may not exist, silently fail
        console.warn("Could not fetch profiles:", profileError.message);
        return;
      }

      if (data) {
        for (const profile of data) {
          userProfiles.value[profile.id] = profile.full_name || "N/A";
        }
      }
    } catch (e) {
      // Silently fail if profiles table doesn't exist
    }
  }

  // --- 4. Actions (Fetch, Create, Update, Delete) ---
  async function fetchGradients() {
    loading.value = true;
    error.value = null;
    try {
      const { data: systemData, error: systemError } = await supabase
        .from("gradients")
        .select("*")
        .eq("is_system", true)
        .order("created_at", { ascending: true });

      if (systemError) throw systemError;
      systemGradients.value = ((systemData || []) as DbGradient[]).map(transformGradient);

      if (currentUserId.value) {
        let query = supabase
          .from("gradients")
          .select("*")
          .eq("is_system", false);
        if (!isAdmin.value) query = query.eq("user_id", currentUserId.value);

        const { data: userData, error: userError } = await query.order(
          "created_at",
          { ascending: false }
        );
        if (userError) throw userError;

        const rawUserGradients = (userData || []) as DbGradient[];

        // Admin: fetch profiles for other users
        if (isAdmin.value && rawUserGradients.length > 0) {
          const otherUserIds = [...new Set(
            rawUserGradients
              .map(g => g.user_id)
              .filter(id => id && id !== currentUserId.value)
          )] as string[];

          if (otherUserIds.length > 0) {
            await fetchUserProfiles(otherUserIds);
          }
        }

        userGradients.value = rawUserGradients.map(transformGradient);
      } else {
        userGradients.value = [];
      }
    } catch (e: any) {
      error.value = e.message || "Gradients could not be loaded";
    } finally {
      loading.value = false;
    }
  }

  async function createGradient(
    input: GradientInput
  ): Promise<Gradient | null> {
    if (!currentUserId.value) return null;
    try {
      const { data, error: insertError } = await supabase
        .from("gradients")
        .insert({
          user_id: currentUserId.value,
          name: input.name,
          description: input.desc,
          tags: input.tags,
          angle: input.angle,
          colors: input.colors,
          is_system: false,
        } as never)
        .select()
        .single();

      if (insertError) throw insertError;
      const newGradient = transformGradient(data as DbGradient);
      userGradients.value.unshift(newGradient);
      return newGradient;
    } catch (e: any) {
      error.value = e.message;
      return null;
    }
  }

  async function updateGradient(id: string, input: GradientInput) {
    if (!currentUserId.value) return false;
    try {
      let query = supabase
        .from("gradients")
        .update({
          name: input.name,
          description: input.desc,
          tags: input.tags,
          angle: input.angle,
          colors: input.colors,
        } as never)
        .eq("id", id);

      // Admin can update any gradient, regular users only their own
      if (!isAdmin.value) {
        query = query.eq("user_id", currentUserId.value);
      }

      const { error: updateError } = await query;
      if (updateError) throw updateError;
      await fetchGradients();
      return true;
    } catch (e: any) {
      error.value = e.message;
      return false;
    }
  }

  async function deleteGradient(id: string) {
    if (!currentUserId.value) return false;
    try {
      let query = supabase
        .from("gradients")
        .delete()
        .eq("id", id);

      // Admin can delete any gradient, regular users only their own
      if (!isAdmin.value) {
        query = query.eq("user_id", currentUserId.value);
      }

      const { error: deleteError } = await query;
      if (deleteError) throw deleteError;
      userGradients.value = userGradients.value.filter((g) => g.id !== id);
      return true;
    } catch (e: any) {
      error.value = e.message;
      return false;
    }
  }

  // --- 5. Return (EKSİKSİZ LİSTE) ---
  return {
    // State (Bunlar eksikti, 500 hatasının sebebi bu!)
    items,
    systemGradients,
    userGradients,
    loading,
    error,
    isAdmin,
    currentUserId,
    // Actions
    fetchGradients,
    createGradient,
    updateGradient,
    deleteGradient,
    // Utils
    cssString: (g: Gradient) =>
      `background: linear-gradient(${g.angle}deg, ${g.colors.join(", ")});`,
    scssString: (g: Gradient) => {
      const colorVars = g.colors
        .map((c, i) => `$color-${i + 1}: ${c};`)
        .join("\n");
      return `${colorVars}\n\n.gradient {\n  background: linear-gradient(${g.angle}deg, ${g.colors.map((_, i) => `$color-${i + 1}`).join(", ")});\n}`;
    },
  };
});
