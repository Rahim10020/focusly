import { AuthContext } from "@/lib/api/middleware/auth";
import { getUserSupabaseClient } from "@/lib/api/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

export class FriendService {
  private supabase: SupabaseClient;
  private auth: AuthContext;

  constructor(auth: AuthContext) {
    this.auth = auth;
    this.supabase = getUserSupabaseClient(auth);
  }

  /**
   * Récupère toutes les relations d'amitié de l'utilisateur (envoyées et reçues).
   */
  async getFriends() {
    const { data, error } = await this.supabase
      .from("friends")
      .select(
        `
        id,
        sender_id,
        receiver_id,
        status,
        created_at,
        sender:profiles!friends_sender_id_fkey (
          username,
          avatar_url
        ),
        receiver:profiles!friends_receiver_id_fkey (
          username,
          avatar_url
        )
      `,
      )
      .or(
        `sender_id.eq.${this.auth.userId},receiver_id.eq.${this.auth.userId}`,
      );

    if (error) {
      throw new Error("Failed to fetch friends");
    }

    return data || [];
  }

  /**
   * Envoie une demande d'ami.
   */
  async sendFriendRequest(receiverId: string) {
    if (receiverId === this.auth.userId) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Ensure sender has a profile
    const { data: senderProfile } = await this.supabase
      .from("profiles")
      .select("id")
      .eq("id", this.auth.userId)
      .single();

    if (!senderProfile) {
      // Create profile if it doesn't exist
      const { error: profileError } = await this.supabase
        .from("profiles")
        .insert({
          id: this.auth.userId,
          username: null,
          avatar_url: null,
        });

      if (profileError) {
        throw new Error("Failed to create user profile");
      }
    }

    // Check if receiver has a profile
    const { data: receiverProfile } = await this.supabase
      .from("profiles")
      .select("id")
      .eq("id", receiverId)
      .single();

    if (!receiverProfile) {
      throw new Error("Cannot send friend request to this user");
    }

    // Check if request already exists
    const { data: existing } = await this.supabase
      .from("friends")
      .select("id")
      .or(
        `and(sender_id.eq.${this.auth.userId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${this.auth.userId})`,
      )
      .maybeSingle();

    if (existing) {
      throw new Error("Friend request already exists");
    }

    const { data, error } = await this.supabase
      .from("friends")
      .insert({
        sender_id: this.auth.userId,
        receiver_id: receiverId,
        status: "pending",
      })
      .select(
        `
        *,
        sender:profiles!friends_sender_id_fkey (
          username,
          avatar_url
        ),
        receiver:profiles!friends_receiver_id_fkey (
          username,
          avatar_url
        )
      `,
      )
      .single();

    if (error) {
      throw new Error("Failed to send friend request");
    }

    return data;
  }
}
