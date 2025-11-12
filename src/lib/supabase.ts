export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number;
          currency: Database["public"]["Enums"]["currency_type"];
          held: number;
          id: string;
          owner_id: string;
          owner_type: Database["public"]["Enums"]["owner_type"];
          type: Database["public"]["Enums"]["account_type"];
        };
        Insert: {
          balance?: number;
          currency: Database["public"]["Enums"]["currency_type"];
          held?: number;
          id?: string;
          owner_id: string;
          owner_type: Database["public"]["Enums"]["owner_type"];
          type: Database["public"]["Enums"]["account_type"];
        };
        Update: {
          balance?: number;
          currency?: Database["public"]["Enums"]["currency_type"];
          held?: number;
          id?: string;
          owner_id?: string;
          owner_type?: Database["public"]["Enums"]["owner_type"];
          type?: Database["public"]["Enums"]["account_type"];
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          changed_at: string;
          changed_by: string;
          id: number;
          new_data: Json | null;
          operation: string;
          original_data: Json | null;
          record_id: string;
          table_name: string;
        };
        Insert: {
          changed_at?: string;
          changed_by: string;
          id?: number;
          new_data?: Json | null;
          operation: string;
          original_data?: Json | null;
          record_id: string;
          table_name: string;
        };
        Update: {
          changed_at?: string;
          changed_by?: string;
          id?: number;
          new_data?: Json | null;
          operation?: string;
          original_data?: Json | null;
          record_id?: string;
          table_name?: string;
        };
        Relationships: [];
      };
      bid_items: {
        Row: {
          bid_id: string;
          created_at: string;
          id: string;
          notes: string | null;
          price: number;
          quantity: number;
          request_item_id: string;
          total_price: number;
        };
        Insert: {
          bid_id: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          price: number;
          quantity: number;
          request_item_id: string;
          total_price: number;
        };
        Update: {
          bid_id?: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          price?: number;
          quantity?: number;
          request_item_id?: string;
          total_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "bid_items_bid_id_fkey";
            columns: ["bid_id"];
            isOneToOne: false;
            referencedRelation: "bids";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bid_items_request_item_id_fkey";
            columns: ["request_item_id"];
            isOneToOne: false;
            referencedRelation: "request_items";
            referencedColumns: ["id"];
          },
        ];
      };
      bids: {
        Row: {
          contractor_id: string;
          created_at: string;
          days_needed: number | null;
          id: string;
          notes: string | null;
          request_id: string;
          status: string;
          total_price: number;
          updated_at: string;
        };
        Insert: {
          contractor_id: string;
          created_at?: string;
          days_needed?: number | null;
          id?: string;
          notes?: string | null;
          request_id: string;
          status: string;
          total_price: number;
          updated_at: string;
        };
        Update: {
          contractor_id?: string;
          created_at?: string;
          days_needed?: number | null;
          id?: string;
          notes?: string | null;
          request_id?: string;
          status?: string;
          total_price?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bids_contractor_id_fkey";
            columns: ["contractor_id"];
            isOneToOne: false;
            referencedRelation: "contractors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bids_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "requests";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string | null;
          phone_number: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          first_name: string;
          id: string;
          last_name?: string | null;
          phone_number: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string | null;
          phone_number?: string;
        };
        Relationships: [];
      };
      company: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      contract_items: {
        Row: {
          contract_id: string;
          created_at: string;
          created_by: string;
          id: string;
          price: number;
          quantity: number;
          service_id: string;
          total_price: number;
          unit: string;
        };
        Insert: {
          contract_id: string;
          created_at?: string;
          created_by: string;
          id?: string;
          price: number;
          quantity?: number;
          service_id: string;
          total_price: number;
          unit: string;
        };
        Update: {
          contract_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          price?: number;
          quantity?: number;
          service_id?: string;
          total_price?: number;
          unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contract_items_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contract_items_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      contract_payments: {
        Row: {
          amount: number;
          approved_by: string | null;
          contract_id: string;
          contractor_id: string | null;
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          status: string;
        };
        Insert: {
          amount?: number;
          approved_by?: string | null;
          contract_id: string;
          contractor_id?: string | null;
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          status?: string;
        };
        Update: {
          amount?: number;
          approved_by?: string | null;
          contract_id?: string;
          contractor_id?: string | null;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contract_payments_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contract_payments_contractor_id_fkey";
            columns: ["contractor_id"];
            isOneToOne: false;
            referencedRelation: "contractors";
            referencedColumns: ["id"];
          },
        ];
      };
      contract_reports: {
        Row: {
          amount: number | null;
          contract_id: string;
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          img_url: string | null;
          project_id: string;
        };
        Insert: {
          amount?: number | null;
          contract_id: string;
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          img_url?: string | null;
          project_id: string;
        };
        Update: {
          amount?: number | null;
          contract_id?: string;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          img_url?: string | null;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contract_reports_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contract_reports_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      contractor_specializations: {
        Row: {
          specialization_id: string;
          user_id: string;
        };
        Insert: {
          specialization_id: string;
          user_id: string;
        };
        Update: {
          specialization_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contractor_specializations_specialization_id_fkey";
            columns: ["specialization_id"];
            isOneToOne: false;
            referencedRelation: "specializations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_specializations_user_id_fkey1";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "contractors";
            referencedColumns: ["id"];
          },
        ];
      };
      contractors: {
        Row: {
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string | null;
          phone_number: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          first_name: string;
          id?: string;
          last_name?: string | null;
          phone_number: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string | null;
          phone_number?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contracts: {
        Row: {
          amount: number;
          assigned_to: string | null;
          created_at: string;
          created_by: string;
          end_date: string | null;
          id: string;
          payment_schedule: string | null;
          project_id: string;
          specialization_id: string | null;
          start_date: string | null;
          status: string | null;
          updated_at: string;
        };
        Insert: {
          amount?: number;
          assigned_to?: string | null;
          created_at?: string;
          created_by: string;
          end_date?: string | null;
          id?: string;
          payment_schedule?: string | null;
          project_id: string;
          specialization_id?: string | null;
          start_date?: string | null;
          status?: string | null;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          assigned_to?: string | null;
          created_at?: string;
          created_by?: string;
          end_date?: string | null;
          id?: string;
          payment_schedule?: string | null;
          project_id?: string;
          specialization_id?: string | null;
          start_date?: string | null;
          status?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contracts_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "contractors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contracts_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contracts_specialization_id_fkey";
            columns: ["specialization_id"];
            isOneToOne: false;
            referencedRelation: "specializations";
            referencedColumns: ["id"];
          },
        ];
      };
      departments: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      employee_history: {
        Row: {
          created_at: string;
          employee_id: string;
          end_date: string | null;
          id: string;
          start_date: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          employee_id: string;
          end_date?: string | null;
          id?: string;
          start_date: string;
          status: string;
        };
        Update: {
          created_at?: string;
          employee_id?: string;
          end_date?: string | null;
          id?: string;
          start_date?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employee_history_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
      };
      employees: {
        Row: {
          base_salary: number;
          created_at: string;
          department_id: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string | null;
          phone_number: string;
          specializations_id: string;
          updated_at: string;
        };
        Insert: {
          base_salary?: number;
          created_at?: string;
          department_id: string;
          email: string;
          first_name: string;
          id?: string;
          last_name?: string | null;
          phone_number: string;
          specializations_id: string;
          updated_at?: string;
        };
        Update: {
          base_salary?: number;
          created_at?: string;
          department_id?: string;
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string | null;
          phone_number?: string;
          specializations_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employees_specializations_id_fkey";
            columns: ["specializations_id"];
            isOneToOne: false;
            referencedRelation: "specializations";
            referencedColumns: ["id"];
          },
        ];
      };
      expense_payments: {
        Row: {
          amount: number;
          created_at: string;
          expense_id: string;
          id: string;
          transaction_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          expense_id: string;
          id?: string;
          transaction_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          expense_id?: string;
          id?: string;
          transaction_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expense_payments_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "project_expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expense_payments_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      offer_items: {
        Row: {
          created_at: string;
          id: string;
          offer_id: string;
          price: number;
          quantity: number;
          service_id: string;
          total_price: number;
          unit: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          offer_id: string;
          price?: number;
          quantity?: number;
          service_id: string;
          total_price?: number;
          unit?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          offer_id?: string;
          price?: number;
          quantity?: number;
          service_id?: string;
          total_price?: number;
          unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: "offer_items_offer_id_fkey";
            columns: ["offer_id"];
            isOneToOne: false;
            referencedRelation: "offers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offer_items_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      offers: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          offer_type: string;
          pdf_url: string | null;
          percentage: number | null;
          project_id: string;
          status: string;
          total_price: number;
          type: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          offer_type?: string;
          pdf_url?: string | null;
          percentage?: number | null;
          project_id: string;
          status?: string;
          total_price?: number;
          type?: string | null;
          updated_at?: string;
          version?: number;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          offer_type?: string;
          pdf_url?: string | null;
          percentage?: number | null;
          project_id?: string;
          status?: string;
          total_price?: number;
          type?: string | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "offers_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      permissions: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      project_assignments: {
        Row: {
          assigned_at: string;
          id: string;
          project_id: string;
          project_role_id: string;
          user_id: string;
        };
        Insert: {
          assigned_at?: string;
          id?: string;
          project_id: string;
          project_role_id: string;
          user_id: string;
        };
        Update: {
          assigned_at?: string;
          id?: string;
          project_id?: string;
          project_role_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_assignments_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_assignments_project_role_id_fkey";
            columns: ["project_role_id"];
            isOneToOne: false;
            referencedRelation: "project_roles";
            referencedColumns: ["id"];
          },
        ];
      };
      project_expenses: {
        Row: {
          account_id: string | null;
          amount_paid: number;
          contract_id: string | null;
          created_at: string;
          created_by: string;
          description: string | null;
          Discounting: number | null;
          expense_date: string;
          expense_type: Database["public"]["Enums"]["expense_type"];
          id: string;
          payment_method: Database["public"]["Enums"]["payment_type"];
          phase: Database["public"]["Enums"]["phase_type"];
          project_id: string;
          status: string | null;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          account_id?: string | null;
          amount_paid?: number;
          contract_id?: string | null;
          created_at?: string;
          created_by: string;
          description?: string | null;
          Discounting?: number | null;
          expense_date?: string;
          expense_type: Database["public"]["Enums"]["expense_type"];
          id?: string;
          payment_method: Database["public"]["Enums"]["payment_type"];
          phase: Database["public"]["Enums"]["phase_type"];
          project_id: string;
          status?: string | null;
          total_amount: number;
          updated_at?: string;
        };
        Update: {
          account_id?: string | null;
          amount_paid?: number;
          contract_id?: string | null;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          Discounting?: number | null;
          expense_date?: string;
          expense_type?: Database["public"]["Enums"]["expense_type"];
          id?: string;
          payment_method?: Database["public"]["Enums"]["payment_type"];
          phase?: Database["public"]["Enums"]["phase_type"];
          project_id?: string;
          status?: string | null;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_expenses_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_expenses_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_expenses_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_incomes: {
        Row: {
          amount: number;
          created_at: string;
          created_by: string;
          description: string | null;
          fund: Database["public"]["Enums"]["fund_type"];
          id: string;
          income_date: string;
          payment_method: Database["public"]["Enums"]["payment_type"];
          project_id: string;
          related_expense: string | null;
          transaction_id: string | null;
          updated_at: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          created_by: string;
          description?: string | null;
          fund: Database["public"]["Enums"]["fund_type"];
          id?: string;
          income_date?: string;
          payment_method: Database["public"]["Enums"]["payment_type"];
          project_id: string;
          related_expense?: string | null;
          transaction_id?: string | null;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          fund?: Database["public"]["Enums"]["fund_type"];
          id?: string;
          income_date?: string;
          payment_method?: Database["public"]["Enums"]["payment_type"];
          project_id?: string;
          related_expense?: string | null;
          transaction_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_incomes_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_incomes_related_expense_fkey";
            columns: ["related_expense"];
            isOneToOne: false;
            referencedRelation: "project_expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_incomes_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      project_roles: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      project_specializations: {
        Row: {
          project_id: string;
          specialization_id: string;
        };
        Insert: {
          project_id: string;
          specialization_id: string;
        };
        Update: {
          project_id?: string;
          specialization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_specializations_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_specializations_specialization_id_fkey";
            columns: ["specialization_id"];
            isOneToOne: false;
            referencedRelation: "specializations";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          address: string | null;
          client_id: string;
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          latitude: number | null;
          longitude: number | null;
          name: string;
          percentage: number | null;
          percentage_taken: number;
          serial_number: number | null;
          status: Database["public"]["Enums"]["project_status_enum"];
        };
        Insert: {
          address?: string | null;
          client_id: string;
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          percentage?: number | null;
          percentage_taken?: number;
          serial_number?: number | null;
          status?: Database["public"]["Enums"]["project_status_enum"];
        };
        Update: {
          address?: string | null;
          client_id?: string;
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          percentage?: number | null;
          percentage_taken?: number;
          serial_number?: number | null;
          status?: Database["public"]["Enums"]["project_status_enum"];
        };
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      request_items: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          quantity: number;
          request_id: string;
          service_id: string;
          unit: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          quantity: number;
          request_id: string;
          service_id: string;
          unit: string;
          updated_at: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          quantity?: number;
          request_id?: string;
          service_id?: string;
          unit?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "request_items_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "request_items_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      requests: {
        Row: {
          assigned_to: string | null;
          category: string | null;
          created_at: string;
          created_by: string;
          end_date: string | null;
          id: string;
          mode: Database["public"]["Enums"]["contractor_mode"] | null;
          payment_schedule: string | null;
          project_id: string;
          specialization_id: string | null;
          start_date: string | null;
          status: string | null;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          category?: string | null;
          created_at?: string;
          created_by: string;
          end_date?: string | null;
          id?: string;
          mode?: Database["public"]["Enums"]["contractor_mode"] | null;
          payment_schedule?: string | null;
          project_id: string;
          specialization_id?: string | null;
          start_date?: string | null;
          status?: string | null;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          category?: string | null;
          created_at?: string;
          created_by?: string;
          end_date?: string | null;
          id?: string;
          mode?: Database["public"]["Enums"]["contractor_mode"] | null;
          payment_schedule?: string | null;
          project_id?: string;
          specialization_id?: string | null;
          start_date?: string | null;
          status?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "requests_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "contractors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requests_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requests_specialization_id_fkey";
            columns: ["specialization_id"];
            isOneToOne: false;
            referencedRelation: "specializations";
            referencedColumns: ["id"];
          },
        ];
      };
      role_permissions: {
        Row: {
          permission_id: string;
          role_id: string;
        };
        Insert: {
          permission_id: string;
          role_id: string;
        };
        Update: {
          permission_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          name: string;
          specialization_id: string | null;
          unit: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          specialization_id?: string | null;
          unit?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          specialization_id?: string | null;
          unit?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "services_specialization_id_fkey";
            columns: ["specialization_id"];
            isOneToOne: false;
            referencedRelation: "specializations";
            referencedColumns: ["id"];
          },
        ];
      };
      specialization_permissions: {
        Row: {
          permission_id: string;
          specialization_id: string;
        };
        Insert: {
          permission_id: string;
          specialization_id: string;
        };
        Update: {
          permission_id?: string;
          specialization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "specialization_permissions_permission_id_fkey";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "specialization_permissions_specialization_id_fkey";
            columns: ["specialization_id"];
            isOneToOne: false;
            referencedRelation: "specializations";
            referencedColumns: ["id"];
          },
        ];
      };
      specializations: {
        Row: {
          id: string;
          name: string;
          role_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          role_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "specializations_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      transaction_categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number;
          category_id: string;
          created_at: string;
          description: string | null;
          from_account_id: string;
          id: string;
          to_account_id: string;
          type: Database["public"]["Enums"]["transaction_type"];
        };
        Insert: {
          amount: number;
          category_id: string;
          created_at?: string;
          description?: string | null;
          from_account_id: string;
          id?: string;
          to_account_id: string;
          type: Database["public"]["Enums"]["transaction_type"];
        };
        Update: {
          amount?: number;
          category_id?: string;
          created_at?: string;
          description?: string | null;
          from_account_id?: string;
          id?: string;
          to_account_id?: string;
          type?: Database["public"]["Enums"]["transaction_type"];
        };
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["from_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "transaction_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_to_account_id_fkey";
            columns: ["to_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      user_permissions: {
        Row: {
          allowed: boolean;
          permission_id: string;
          user_id: string;
        };
        Insert: {
          allowed: boolean;
          permission_id: string;
          user_id: string;
        };
        Update: {
          allowed?: boolean;
          permission_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_id_fkey";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          role_id: string;
          user_id: string;
        };
        Insert: {
          role_id: string;
          user_id: string;
        };
        Update: {
          role_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_specializations: {
        Row: {
          specialization_id: string;
          user_id: string;
        };
        Insert: {
          specialization_id: string;
          user_id: string;
        };
        Update: {
          specialization_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_specializations_specialization_id_fkey";
            columns: ["specialization_id"];
            isOneToOne: false;
            referencedRelation: "specializations";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string | null;
          role_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          first_name: string;
          id?: string;
          last_name?: string | null;
          role_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string | null;
          role_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_role_by_email: { Args: { p_email: string }; Returns: string };
      has_permission: {
        Args: { p_perm_name: string; p_user: string };
        Returns: boolean;
      };
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: {
      account_type: "cash" | "bank";
      approval_type: "technical" | "finance";
      contractor_mode: "open" | "direct";
      currency_type: "LYD" | "USD" | "EUR";
      expense_type: "material" | "labor";
      fund_type: "client" | "internal" | "sale" | "refund" | "other";
      offer_approvals_type: "pending" | "approved" | "rejected";
      offer_status:
        | "draft"
        | "sent"
        | "responded"
        | "technically_approved"
        | "finance_approved"
        | "rejected";
      offer_type: "request" | "proposal";
      owner_type: "employee" | "project" | "company" | "contractor";
      payment_type: "cash" | "cheque" | "transfer" | "deposit";
      phase_type: "construction" | "finishing";
      project_status_enum: "active" | "paused" | "completed" | "cancelled";
      projects_type: "construction" | "consulting";
      transaction_type: "debit" | "credit";
      user_status_enum: "active" | "inactive";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_type: ["cash", "bank"],
      approval_type: ["technical", "finance"],
      contractor_mode: ["open", "direct"],
      currency_type: ["LYD", "USD", "EUR"],
      expense_type: ["material", "labor"],
      fund_type: ["client", "internal", "sale", "refund", "other"],
      offer_approvals_type: ["pending", "approved", "rejected"],
      offer_status: [
        "draft",
        "sent",
        "responded",
        "technically_approved",
        "finance_approved",
        "rejected",
      ],
      offer_type: ["request", "proposal"],
      owner_type: ["employee", "project", "company", "contractor"],
      payment_type: ["cash", "cheque", "transfer", "deposit"],
      phase_type: ["construction", "finishing"],
      project_status_enum: ["active", "paused", "completed", "cancelled"],
      projects_type: ["construction", "consulting"],
      transaction_type: ["debit", "credit"],
      user_status_enum: ["active", "inactive"],
    },
  },
} as const;
