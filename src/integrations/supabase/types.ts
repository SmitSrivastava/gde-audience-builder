export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      age_bucket: {
        Row: {
          age_25plus_weight: number
          age_bucket: string
          sort_order: number | null
        }
        Insert: {
          age_25plus_weight?: number
          age_bucket: string
          sort_order?: number | null
        }
        Update: {
          age_25plus_weight?: number
          age_bucket?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      and_intersect_rho: {
        Row: {
          family_a: string
          family_b: string
          formula: string | null
          kind: string | null
          rho_and_expected: number
        }
        Insert: {
          family_a: string
          family_b: string
          formula?: string | null
          kind?: string | null
          rho_and_expected: number
        }
        Update: {
          family_a?: string
          family_b?: string
          formula?: string | null
          kind?: string | null
          rho_and_expected?: number
        }
        Relationships: []
      }
      attribute_catalog: {
        Row: {
          created_at: string
          field: string
          id: string
          source_sheet: string | null
          synonyms: string | null
          value: string
        }
        Insert: {
          created_at?: string
          field: string
          id?: string
          source_sheet?: string | null
          synonyms?: string | null
          value: string
        }
        Update: {
          created_at?: string
          field?: string
          id?: string
          source_sheet?: string | null
          synonyms?: string | null
          value?: string
        }
        Relationships: []
      }
      city_tier: {
        Row: {
          city_name: string
          geo_tier: string | null
          mapping_rule: string | null
          normalized_city: string | null
          zepto_user_count: number | null
        }
        Insert: {
          city_name: string
          geo_tier?: string | null
          mapping_rule?: string | null
          normalized_city?: string | null
          zepto_user_count?: number | null
        }
        Update: {
          city_name?: string
          geo_tier?: string | null
          mapping_rule?: string | null
          normalized_city?: string | null
          zepto_user_count?: number | null
        }
        Relationships: []
      }
      dimension_token: {
        Row: {
          dim: string
          maps_to: string
          token: string
        }
        Insert: {
          dim: string
          maps_to: string
          token: string
        }
        Update: {
          dim?: string
          maps_to?: string
          token?: string
        }
        Relationships: []
      }
      family: {
        Row: {
          family: string
          parent: string | null
          sector: string | null
          siblings: string | null
        }
        Insert: {
          family: string
          parent?: string | null
          sector?: string | null
          siblings?: string | null
        }
        Update: {
          family?: string
          parent?: string | null
          sector?: string | null
          siblings?: string | null
        }
        Relationships: []
      }
      family_pair_rho: {
        Row: {
          family_a: string
          family_b: string
          relation: string | null
          rho_intra_expected: number | null
        }
        Insert: {
          family_a: string
          family_b: string
          relation?: string | null
          rho_intra_expected?: number | null
        }
        Update: {
          family_a?: string
          family_b?: string
          relation?: string | null
          rho_intra_expected?: number | null
        }
        Relationships: []
      }
      gender_bucket: {
        Row: {
          gender_bucket: string
          sort_order: number | null
        }
        Insert: {
          gender_bucket: string
          sort_order?: number | null
        }
        Update: {
          gender_bucket?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      geo_tier: {
        Row: {
          geo_tier: string
          sort_order: number | null
        }
        Insert: {
          geo_tier: string
          sort_order?: number | null
        }
        Update: {
          geo_tier?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      golden_test: {
        Row: {
          brief: string
          confidence: string | null
          female_share: number | null
          join: string | null
          matched_n: number | null
          metro_share: number | null
          partners: string | null
          people_reach: number | null
          primary_signal: string | null
          query_ir_json: Json | null
          test_id: string
        }
        Insert: {
          brief: string
          confidence?: string | null
          female_share?: number | null
          join?: string | null
          matched_n?: number | null
          metro_share?: number | null
          partners?: string | null
          people_reach?: number | null
          primary_signal?: string | null
          query_ir_json?: Json | null
          test_id: string
        }
        Update: {
          brief?: string
          confidence?: string | null
          female_share?: number | null
          join?: string | null
          matched_n?: number | null
          metro_share?: number | null
          partners?: string | null
          people_reach?: number | null
          primary_signal?: string | null
          query_ir_json?: Json | null
          test_id?: string
        }
        Relationships: []
      }
      hard_rule: {
        Row: {
          rule: string
          rule_id: string
        }
        Insert: {
          rule: string
          rule_id: string
        }
        Update: {
          rule?: string
          rule_id?: string
        }
        Relationships: []
      }
      india_pop_cap: {
        Row: {
          age_bucket: string
          gender_bucket: string
          geo_tier: string
          india_18plus_ceiling: number
        }
        Insert: {
          age_bucket: string
          gender_bucket: string
          geo_tier: string
          india_18plus_ceiling: number
        }
        Update: {
          age_bucket?: string
          gender_bucket?: string
          geo_tier?: string
          india_18plus_ceiling?: number
        }
        Relationships: []
      }
      intra_overlap_rule: {
        Row: {
          hard_note: string | null
          rho_aggressive: number | null
          rho_conservative: number | null
          rho_expected: number | null
          rule_id: string
          when: string | null
        }
        Insert: {
          hard_note?: string | null
          rho_aggressive?: number | null
          rho_conservative?: number | null
          rho_expected?: number | null
          rule_id: string
          when?: string | null
        }
        Update: {
          hard_note?: string | null
          rho_aggressive?: number | null
          rho_conservative?: number | null
          rho_expected?: number | null
          rule_id?: string
          when?: string | null
        }
        Relationships: []
      }
      join_op: {
        Row: {
          engine: string | null
          example: string | null
          join: string
        }
        Insert: {
          engine?: string | null
          example?: string | null
          join: string
        }
        Update: {
          engine?: string | null
          example?: string | null
          join?: string
        }
        Relationships: []
      }
      layer: {
        Row: {
          layer: string
          sort_order: number | null
          ui_blurb: string | null
        }
        Insert: {
          layer: string
          sort_order?: number | null
          ui_blurb?: string | null
        }
        Update: {
          layer?: string
          sort_order?: number | null
          ui_blurb?: string | null
        }
        Relationships: []
      }
      modifier_op: {
        Row: {
          metro_tilt: number | null
          op: string
          rule: string | null
          scale_param: number | null
          token: string
        }
        Insert: {
          metro_tilt?: number | null
          op: string
          rule?: string | null
          scale_param?: number | null
          token: string
        }
        Update: {
          metro_tilt?: number | null
          op?: string
          rule?: string | null
          scale_param?: number | null
          token?: string
        }
        Relationships: []
      }
      nesting_rule: {
        Row: {
          action: string | null
          kind: string | null
          parent_token: string | null
          query_token: string
        }
        Insert: {
          action?: string | null
          kind?: string | null
          parent_token?: string | null
          query_token: string
        }
        Update: {
          action?: string | null
          kind?: string | null
          parent_token?: string | null
          query_token?: string
        }
        Relationships: []
      }
      partner: {
        Row: {
          partner_name: string
          sort_order: number | null
        }
        Insert: {
          partner_name: string
          sort_order?: number | null
        }
        Update: {
          partner_name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      partner_rho: {
        Row: {
          attribute_relation: string
          base_rho: number | null
          partner_a: string
          partner_b: string
          rho_cross_pii: number | null
          rho_same_pii: number | null
          scale: number | null
        }
        Insert: {
          attribute_relation: string
          base_rho?: number | null
          partner_a: string
          partner_b: string
          rho_cross_pii?: number | null
          rho_same_pii?: number | null
          scale?: number | null
        }
        Update: {
          attribute_relation?: string
          base_rho?: number | null
          partner_a?: string
          partner_b?: string
          rho_cross_pii?: number | null
          rho_same_pii?: number | null
          scale?: number | null
        }
        Relationships: []
      }
      partner_universe: {
        Row: {
          partner_name: string
          pii: string
          universe: number
        }
        Insert: {
          partner_name: string
          pii: string
          universe: number
        }
        Update: {
          partner_name?: string
          pii?: string
          universe?: number
        }
        Relationships: []
      }
      query_cache: {
        Row: {
          brief_norm: string
          brief_norm_hash: string
          created_at: string
          query_ir: Json
          source: string
        }
        Insert: {
          brief_norm: string
          brief_norm_hash: string
          created_at?: string
          query_ir: Json
          source: string
        }
        Update: {
          brief_norm?: string
          brief_norm_hash?: string
          created_at?: string
          query_ir?: Json
          source?: string
        }
        Relationships: []
      }
      reliability_rule: {
        Row: {
          note: string | null
          partner: string
          reliability: number
          when_match: string
        }
        Insert: {
          note?: string | null
          partner: string
          reliability: number
          when_match: string
        }
        Update: {
          note?: string | null
          partner?: string
          reliability?: number
          when_match?: string
        }
        Relationships: []
      }
      result_cache: {
        Row: {
          created_at: string
          payload: Json
          query_ir: Json
          query_ir_hash: string
        }
        Insert: {
          created_at?: string
          payload: Json
          query_ir: Json
          query_ir_hash: string
        }
        Update: {
          created_at?: string
          payload?: Json
          query_ir?: Json
          query_ir_hash?: string
        }
        Relationships: []
      }
      seed_chip: {
        Row: {
          chip_label: string
          family: string | null
          modifier: string | null
        }
        Insert: {
          chip_label: string
          family?: string | null
          modifier?: string | null
        }
        Update: {
          chip_label?: string
          family?: string | null
          modifier?: string | null
        }
        Relationships: []
      }
      signal: {
        Row: {
          category: string | null
          embedding: string | null
          layer: string | null
          master_signal_id: string
          partner_name: string
          pct_23_28: number | null
          pct_29_34: number | null
          pct_35_40: number | null
          pct_41_46: number | null
          pct_47plus: number | null
          pct_female: number | null
          pct_lt22: number | null
          pct_male: number | null
          pct_metro: number | null
          pct_others: number | null
          pct_tier1: number | null
          pct_tier2: number | null
          pct_tier3: number | null
          pii: string
          pii_raw: string | null
          platform_tags: string | null
          product_families: string | null
          reliability: number
          row_role: string | null
          search_blob: string | null
          sector: string | null
          signal: string | null
          source_row_id: number | null
          sub_category: string | null
          volume: number | null
        }
        Insert: {
          category?: string | null
          embedding?: string | null
          layer?: string | null
          master_signal_id: string
          partner_name: string
          pct_23_28?: number | null
          pct_29_34?: number | null
          pct_35_40?: number | null
          pct_41_46?: number | null
          pct_47plus?: number | null
          pct_female?: number | null
          pct_lt22?: number | null
          pct_male?: number | null
          pct_metro?: number | null
          pct_others?: number | null
          pct_tier1?: number | null
          pct_tier2?: number | null
          pct_tier3?: number | null
          pii: string
          pii_raw?: string | null
          platform_tags?: string | null
          product_families?: string | null
          reliability?: number
          row_role?: string | null
          search_blob?: string | null
          sector?: string | null
          signal?: string | null
          source_row_id?: number | null
          sub_category?: string | null
          volume?: number | null
        }
        Update: {
          category?: string | null
          embedding?: string | null
          layer?: string | null
          master_signal_id?: string
          partner_name?: string
          pct_23_28?: number | null
          pct_29_34?: number | null
          pct_35_40?: number | null
          pct_41_46?: number | null
          pct_47plus?: number | null
          pct_female?: number | null
          pct_lt22?: number | null
          pct_male?: number | null
          pct_metro?: number | null
          pct_others?: number | null
          pct_tier1?: number | null
          pct_tier2?: number | null
          pct_tier3?: number | null
          pii?: string
          pii_raw?: string | null
          platform_tags?: string | null
          product_families?: string | null
          reliability?: number
          row_role?: string | null
          search_blob?: string | null
          sector?: string | null
          signal?: string | null
          source_row_id?: number | null
          sub_category?: string | null
          volume?: number | null
        }
        Relationships: []
      }
      signal_cell: {
        Row: {
          age_bucket: string
          gender_bucket: string
          geo_tier: string
          joint_share: number | null
          master_signal_id: string
          volume: number
        }
        Insert: {
          age_bucket: string
          gender_bucket: string
          geo_tier: string
          joint_share?: number | null
          master_signal_id: string
          volume: number
        }
        Update: {
          age_bucket?: string
          gender_bucket?: string
          geo_tier?: string
          joint_share?: number | null
          master_signal_id?: string
          volume?: number
        }
        Relationships: []
      }
      synonym: {
        Row: {
          family: string
          role: string
          token: string
          weight: number
        }
        Insert: {
          family: string
          role: string
          token: string
          weight?: number
        }
        Update: {
          family?: string
          role?: string
          token?: string
          weight?: number
        }
        Relationships: []
      }
      vertex_config: {
        Row: {
          key: string
          value: string | null
        }
        Insert: {
          key: string
          value?: string | null
        }
        Update: {
          key?: string
          value?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_signals: {
        Args: {
          match_count?: number
          min_sim?: number
          query_embedding: string
        }
        Returns: {
          category: string
          layer: string
          master_signal_id: string
          partner_name: string
          pii: string
          platform_tags: string
          product_families: string
          reliability: number
          row_role: string
          sector: string
          signal: string
          sim: number
          sub_category: string
          volume: number
        }[]
      }
      set_signal_embeddings: { Args: { payload: Json }; Returns: number }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slice_signals: {
        Args: {
          above_age: number
          ages: string[]
          genders: string[]
          geos: string[]
          ids: string[]
        }
        Returns: {
          master_signal_id: string
          slice_volume: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
