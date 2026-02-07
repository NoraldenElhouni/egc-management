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
          id: string;
          owner_id: string;
          owner_type: Database["public"]["Enums"]["owner_type"];
          total_transactions: number;
          type: Database["public"]["Enums"]["account_type"];
        };
        Insert: {
          balance?: number;
          currency: Database["public"]["Enums"]["currency_type"];
          id?: string;
          owner_id: string;
          owner_type: Database["public"]["Enums"]["owner_type"];
          total_transactions?: number;
          type: Database["public"]["Enums"]["account_type"];
        };
        Update: {
          balance?: number;
          currency?: Database["public"]["Enums"]["currency_type"];
          id?: string;
          owner_id?: string;
          owner_type?: Database["public"]["Enums"]["owner_type"];
          total_transactions?: number;
          type?: Database["public"]["Enums"]["account_type"];
        };
        Relationships: [
          {
            foreignKeyName: "accounts_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "clients_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      company: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          projects_counter: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          projects_counter?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          projects_counter?: number;
        };
        Relationships: [];
      };
      company_account: {
        Row: {
          bank_balance: number;
          cash_balance: number;
          created_at: string;
          id: string;
          status: string;
          type: string;
        };
        Insert: {
          bank_balance?: number;
          cash_balance?: number;
          created_at?: string;
          id?: string;
          status?: string;
          type: string;
        };
        Update: {
          bank_balance?: number;
          cash_balance?: number;
          created_at?: string;
          id?: string;
          status?: string;
          type?: string;
        };
        Relationships: [];
      };
      company_discounts: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          note: string;
          period_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          note: string;
          period_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          note?: string;
          period_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_discounts_period_id_fkey";
            columns: ["period_id"];
            isOneToOne: false;
            referencedRelation: "project_percentage_periods";
            referencedColumns: ["id"];
          },
        ];
      };
      company_expense: {
        Row: {
          amount: number;
          company_id: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          expense_date: string;
          id: string;
          reference_id: string | null;
          type: string;
        };
        Insert: {
          amount: number;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          expense_date?: string;
          id?: string;
          reference_id?: string | null;
          type: string;
        };
        Update: {
          amount?: number;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          expense_date?: string;
          id?: string;
          reference_id?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_expense_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "company";
            referencedColumns: ["id"];
          },
        ];
      };
      company_held: {
        Row: {
          amount: number;
          created_at: string;
          employee_id: string;
          id: string;
          note: string;
          period_id: string;
          type: Database["public"]["Enums"]["payment_type"];
        };
        Insert: {
          amount: number;
          created_at?: string;
          employee_id: string;
          id?: string;
          note: string;
          period_id: string;
          type: Database["public"]["Enums"]["payment_type"];
        };
        Update: {
          amount?: number;
          created_at?: string;
          employee_id?: string;
          id?: string;
          note?: string;
          period_id?: string;
          type?: Database["public"]["Enums"]["payment_type"];
        };
        Relationships: [
          {
            foreignKeyName: "compan_ hed_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compan_ hed_period_id_fkey";
            columns: ["period_id"];
            isOneToOne: false;
            referencedRelation: "project_percentage_periods";
            referencedColumns: ["id"];
          },
        ];
      };
      company_payment: {
        Row: {
          account_id: string;
          amount: number;
          created_at: string;
          created_by: string | null;
          expense_id: string;
          id: string;
          payment_method: string | null;
          serial_number: number | null;
        };
        Insert: {
          account_id: string;
          amount: number;
          created_at?: string;
          created_by?: string | null;
          expense_id: string;
          id?: string;
          payment_method?: string | null;
          serial_number?: number | null;
        };
        Update: {
          account_id?: string;
          amount?: number;
          created_at?: string;
          created_by?: string | null;
          expense_id?: string;
          id?: string;
          payment_method?: string | null;
          serial_number?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "company_payment_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_payment_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "company_expense";
            referencedColumns: ["id"];
          },
        ];
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
          expense_id: string | null;
          id: string;
          project_id: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          amount?: number;
          approved_by?: string | null;
          contract_id: string;
          contractor_id?: string | null;
          created_at?: string;
          created_by: string;
          description?: string | null;
          expense_id?: string | null;
          id?: string;
          project_id: string;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          amount?: number;
          approved_by?: string | null;
          contract_id?: string;
          contractor_id?: string | null;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          expense_id?: string | null;
          id?: string;
          project_id?: string;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contract_payments_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
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
          {
            foreignKeyName: "contract_payments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contract_payments_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "project_expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contract_payments_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
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
            foreignKeyName: "contract_reports_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "employees";
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
          email: string | null;
          first_name: string;
          id: string;
          last_name: string | null;
          phone_number: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          first_name: string;
          id?: string;
          last_name?: string | null;
          phone_number?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          first_name?: string;
          id?: string;
          last_name?: string | null;
          phone_number?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contractors_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
            foreignKeyName: "contracts_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
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
      employee_account: {
        Row: {
          bank_balance: number;
          bank_held: number;
          cash_balance: number;
          cash_held: number;
          created_at: string;
          id: string;
          loan_debt: number;
          status: string;
        };
        Insert: {
          bank_balance?: number;
          bank_held?: number;
          cash_balance?: number;
          cash_held?: number;
          created_at?: string;
          id?: string;
          loan_debt?: number;
          status?: string;
        };
        Update: {
          bank_balance?: number;
          bank_held?: number;
          cash_balance?: number;
          cash_held?: number;
          created_at?: string;
          id?: string;
          loan_debt?: number;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "emplyee_accounts_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
      };
      employee_certifications: {
        Row: {
          certification: string;
          created_at: string;
          employee_id: string;
          id: string;
        };
        Insert: {
          certification: string;
          created_at?: string;
          employee_id: string;
          id?: string;
        };
        Update: {
          certification?: string;
          created_at?: string;
          employee_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employee_certifications_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
      };
      employee_discounts: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          note: string;
          period_id: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          note: string;
          period_id: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          note?: string;
          period_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employee_discounts_period_id_fkey";
            columns: ["period_id"];
            isOneToOne: false;
            referencedRelation: "project_percentage_periods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employee_discounts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
      };
      employee_documents: {
        Row: {
          created_at: string;
          doc_type: string;
          employee_id: string;
          id: string;
          uploaded_by: string | null;
          url: string | null;
        };
        Insert: {
          created_at?: string;
          doc_type: string;
          employee_id: string;
          id?: string;
          uploaded_by?: string | null;
          url?: string | null;
        };
        Update: {
          created_at?: string;
          doc_type?: string;
          employee_id?: string;
          id?: string;
          uploaded_by?: string | null;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
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
      employee_leaves: {
        Row: {
          created_at: string;
          employee_id: string | null;
          end_date: string | null;
          id: string;
          leave_reason: string | null;
          start_date: string | null;
        };
        Insert: {
          created_at?: string;
          employee_id?: string | null;
          end_date?: string | null;
          id?: string;
          leave_reason?: string | null;
          start_date?: string | null;
        };
        Update: {
          created_at?: string;
          employee_id?: string | null;
          end_date?: string | null;
          id?: string;
          leave_reason?: string | null;
          start_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "employee_leaves_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
      };
      employees: {
        Row: {
          address: string | null;
          alternate_phone: string | null;
          bank_account_number: string | null;
          bank_name: string | null;
          base_salary: number;
          blood_type: string | null;
          created_at: string;
          date_of_joining: string | null;
          dob: string | null;
          email: string;
          emergency_contact: string | null;
          emergency_contact_phone: string | null;
          emergency_contact_relation: string | null;
          employee_id: string;
          employee_type: Database["public"]["Enums"]["employee_type"] | null;
          first_name: string;
          gender: string | null;
          gpa: number | null;
          graduation_year: number | null;
          highest_qualification: string | null;
          id: string;
          id_proof_url: string | null;
          last_name: string | null;
          manager_id: string | null;
          marital_status: string | null;
          nationality: string | null;
          personal_email: string | null;
          personal_photo_url: string | null;
          phone_number: string;
          place_of_birth: string | null;
          resume_url: string | null;
          salary_type: string | null;
          specializations_id: string | null;
          status: string | null;
          university: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          alternate_phone?: string | null;
          bank_account_number?: string | null;
          bank_name?: string | null;
          base_salary?: number;
          blood_type?: string | null;
          created_at?: string;
          date_of_joining?: string | null;
          dob?: string | null;
          email: string;
          emergency_contact?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relation?: string | null;
          employee_id: string;
          employee_type?: Database["public"]["Enums"]["employee_type"] | null;
          first_name: string;
          gender?: string | null;
          gpa?: number | null;
          graduation_year?: number | null;
          highest_qualification?: string | null;
          id?: string;
          id_proof_url?: string | null;
          last_name?: string | null;
          manager_id?: string | null;
          marital_status?: string | null;
          nationality?: string | null;
          personal_email?: string | null;
          personal_photo_url?: string | null;
          phone_number: string;
          place_of_birth?: string | null;
          resume_url?: string | null;
          salary_type?: string | null;
          specializations_id?: string | null;
          status?: string | null;
          university?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          alternate_phone?: string | null;
          bank_account_number?: string | null;
          bank_name?: string | null;
          base_salary?: number;
          blood_type?: string | null;
          created_at?: string;
          date_of_joining?: string | null;
          dob?: string | null;
          email?: string;
          emergency_contact?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relation?: string | null;
          employee_id?: string;
          employee_type?: Database["public"]["Enums"]["employee_type"] | null;
          first_name?: string;
          gender?: string | null;
          gpa?: number | null;
          graduation_year?: number | null;
          highest_qualification?: string | null;
          id?: string;
          id_proof_url?: string | null;
          last_name?: string | null;
          manager_id?: string | null;
          marital_status?: string | null;
          nationality?: string | null;
          personal_email?: string | null;
          personal_photo_url?: string | null;
          phone_number?: string;
          place_of_birth?: string | null;
          resume_url?: string | null;
          salary_type?: string | null;
          specializations_id?: string | null;
          status?: string | null;
          university?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employees_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employees_manager_id_fkey";
            columns: ["manager_id"];
            isOneToOne: false;
            referencedRelation: "employees";
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
          account_id: string | null;
          amount: number;
          created_at: string;
          created_by: string | null;
          expense_id: string;
          expense_no: number | null;
          id: string;
          invoice_no: number | null;
          payment_method: string | null;
          payment_no: number | null;
          serial_number: number | null;
        };
        Insert: {
          account_id?: string | null;
          amount: number;
          created_at?: string;
          created_by?: string | null;
          expense_id: string;
          expense_no?: number | null;
          id?: string;
          invoice_no?: number | null;
          payment_method?: string | null;
          payment_no?: number | null;
          serial_number?: number | null;
        };
        Update: {
          account_id?: string | null;
          amount?: number;
          created_at?: string;
          created_by?: string | null;
          expense_id?: string;
          expense_no?: number | null;
          id?: string;
          invoice_no?: number | null;
          payment_method?: string | null;
          payment_no?: number | null;
          serial_number?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "expense_payments_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expense_payments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expense_payments_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "project_expenses";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          usage_count: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          usage_count?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          usage_count?: number;
        };
        Relationships: [];
      };
      leave_types: {
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
      map_types: {
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
      maps_distribution_details: {
        Row: {
          amount: number;
          created_at: string;
          distribution_type: string;
          employee_id: string | null;
          id: string;
          map_item_id: string;
          percentage: number;
        };
        Insert: {
          amount: number;
          created_at?: string;
          distribution_type: string;
          employee_id?: string | null;
          id?: string;
          map_item_id: string;
          percentage: number;
        };
        Update: {
          amount?: number;
          created_at?: string;
          distribution_type?: string;
          employee_id?: string | null;
          id?: string;
          map_item_id?: string;
          percentage?: number;
        };
        Relationships: [
          {
            foreignKeyName: "maps_distribution_details_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "maps_distribution_details_map_item_id_fkey";
            columns: ["map_item_id"];
            isOneToOne: false;
            referencedRelation: "maps_distribution_items";
            referencedColumns: ["id"];
          },
        ];
      };
      maps_distribution_items: {
        Row: {
          created_at: string;
          distribution_id: string;
          id: string;
          price: number;
          quantity: number;
          total: number;
          type_id: string;
        };
        Insert: {
          created_at?: string;
          distribution_id: string;
          id?: string;
          price: number;
          quantity: number;
          total: number;
          type_id: string;
        };
        Update: {
          created_at?: string;
          distribution_id?: string;
          id?: string;
          price?: number;
          quantity?: number;
          total?: number;
          type_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "maps_distribution_items_distribution_id_fkey";
            columns: ["distribution_id"];
            isOneToOne: false;
            referencedRelation: "maps_distributions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "maps_distribution_items_type_id_fkey";
            columns: ["type_id"];
            isOneToOne: false;
            referencedRelation: "map_types";
            referencedColumns: ["id"];
          },
        ];
      };
      maps_distributions: {
        Row: {
          created_at: string;
          created_by: string;
          description: string;
          id: string;
          project_id: string;
          total_amount: number;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description: string;
          id?: string;
          project_id: string;
          total_amount?: number;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string;
          id?: string;
          project_id?: string;
          total_amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: "maps_distributions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "maps_distributions_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
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
      payroll: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          basic_salary: number | null;
          created_at: string;
          created_by: string | null;
          employee_id: string;
          id: string;
          pay_date: string;
          payment_method: Database["public"]["Enums"]["payment_method"];
          percentage_salary: number | null;
          project_id: string | null;
          status: string;
          total_salary: number;
          updated_at: string | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          basic_salary?: number | null;
          created_at?: string;
          created_by?: string | null;
          employee_id: string;
          id?: string;
          pay_date: string;
          payment_method: Database["public"]["Enums"]["payment_method"];
          percentage_salary?: number | null;
          project_id?: string | null;
          status?: string;
          total_salary?: number;
          updated_at?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          basic_salary?: number | null;
          created_at?: string;
          created_by?: string | null;
          employee_id?: string;
          id?: string;
          pay_date?: string;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          percentage_salary?: number | null;
          project_id?: string | null;
          status?: string;
          total_salary?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payroll_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payroll_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payroll_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payroll_project_id_fkey";
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
          percentage: number;
          project_id: string;
          project_role_id: string;
          user_id: string;
        };
        Insert: {
          assigned_at?: string;
          id?: string;
          percentage?: number;
          project_id: string;
          project_role_id: string;
          user_id: string;
        };
        Update: {
          assigned_at?: string;
          id?: string;
          percentage?: number;
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
          {
            foreignKeyName: "project_assignments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
      };
      project_balances: {
        Row: {
          balance: number;
          currency: string;
          held: number;
          id: string;
          project_id: string;
          total_expense: number;
          total_transactions: number;
        };
        Insert: {
          balance?: number;
          currency: string;
          held?: number;
          id?: string;
          project_id: string;
          total_expense?: number;
          total_transactions?: number;
        };
        Update: {
          balance?: number;
          currency?: string;
          held?: number;
          id?: string;
          project_id?: string;
          total_expense?: number;
          total_transactions?: number;
        };
        Relationships: [
          {
            foreignKeyName: "project_balances_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_expenses: {
        Row: {
          amount_paid: number;
          contract_id: string | null;
          contractor_id: string | null;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          Discounting: number | null;
          expense_date: string;
          expense_id: string | null;
          expense_type: Database["public"]["Enums"]["expense_type"];
          id: string;
          is_edited: boolean | null;
          is_percentage: boolean | null;
          payment_counter: number;
          phase: Database["public"]["Enums"]["phase_type"];
          project_id: string;
          serial_number: number | null;
          status: Database["public"]["Enums"]["expense_status"] | null;
          total_amount: number;
          updated_at: string;
          vendor_id: string | null;
        };
        Insert: {
          amount_paid?: number;
          contract_id?: string | null;
          contractor_id?: string | null;
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          Discounting?: number | null;
          expense_date?: string;
          expense_id?: string | null;
          expense_type: Database["public"]["Enums"]["expense_type"];
          id?: string;
          is_edited?: boolean | null;
          is_percentage?: boolean | null;
          payment_counter?: number;
          phase: Database["public"]["Enums"]["phase_type"];
          project_id: string;
          serial_number?: number | null;
          status?: Database["public"]["Enums"]["expense_status"] | null;
          total_amount: number;
          updated_at?: string;
          vendor_id?: string | null;
        };
        Update: {
          amount_paid?: number;
          contract_id?: string | null;
          contractor_id?: string | null;
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          Discounting?: number | null;
          expense_date?: string;
          expense_id?: string | null;
          expense_type?: Database["public"]["Enums"]["expense_type"];
          id?: string;
          is_edited?: boolean | null;
          is_percentage?: boolean | null;
          payment_counter?: number;
          phase?: Database["public"]["Enums"]["phase_type"];
          project_id?: string;
          serial_number?: number | null;
          status?: Database["public"]["Enums"]["expense_status"] | null;
          total_amount?: number;
          updated_at?: string;
          vendor_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "project_expenses_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_expenses_contractor_id_fkey";
            columns: ["contractor_id"];
            isOneToOne: false;
            referencedRelation: "contractors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_expenses_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_expenses_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_expenses_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_expenses_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id"];
          },
        ];
      };
      project_incomes: {
        Row: {
          amount: number;
          client_name: string | null;
          created_at: string;
          created_by: string;
          description: string | null;
          fund: Database["public"]["Enums"]["fund_type"];
          id: string;
          income_date: string;
          payment_method: Database["public"]["Enums"]["payment_type"];
          project_id: string;
          related_expense: string | null;
          serial_number: number;
          updated_at: string;
        };
        Insert: {
          amount: number;
          client_name?: string | null;
          created_at?: string;
          created_by: string;
          description?: string | null;
          fund: Database["public"]["Enums"]["fund_type"];
          id?: string;
          income_date?: string;
          payment_method: Database["public"]["Enums"]["payment_type"];
          project_id: string;
          related_expense?: string | null;
          serial_number: number;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          client_name?: string | null;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          fund?: Database["public"]["Enums"]["fund_type"];
          id?: string;
          income_date?: string;
          payment_method?: Database["public"]["Enums"]["payment_type"];
          project_id?: string;
          related_expense?: string | null;
          serial_number?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_incomes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
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
        ];
      };
      project_percentage: {
        Row: {
          created_at: string;
          currency: Database["public"]["Enums"]["currency_type"] | null;
          id: string;
          percentage: number;
          period_percentage: number;
          period_start: string;
          project_id: string;
          total_percentage: number;
          type: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency_type"] | null;
          id?: string;
          percentage?: number;
          period_percentage?: number;
          period_start: string;
          project_id: string;
          total_percentage?: number;
          type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency_type"] | null;
          id?: string;
          percentage?: number;
          period_percentage?: number;
          period_start?: string;
          project_id?: string;
          total_percentage?: number;
          type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "project_percentage_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_percentage_logs: {
        Row: {
          amount: number;
          created_at: string | null;
          expense_id: string;
          id: string;
          payment_id: string;
          percentage: number;
          project_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          expense_id: string;
          id?: string;
          payment_id: string;
          percentage: number;
          project_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          expense_id?: string;
          id?: string;
          payment_id?: string;
          percentage?: number;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_percentage_logs_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "project_expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_percentage_logs_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "expense_payments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_percentage_logs_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_percentage_period_items: {
        Row: {
          bank_amount: number;
          bank_held: number;
          cash_amount: number;
          cash_held: number;
          created_at: string;
          discount: number;
          id: string;
          item_type: string;
          note: string | null;
          percentage: number;
          period_id: string;
          total: number;
          user_id: string | null;
        };
        Insert: {
          bank_amount: number;
          bank_held: number;
          cash_amount: number;
          cash_held: number;
          created_at?: string;
          discount: number;
          id?: string;
          item_type: string;
          note?: string | null;
          percentage: number;
          period_id: string;
          total: number;
          user_id?: string | null;
        };
        Update: {
          bank_amount?: number;
          bank_held?: number;
          cash_amount?: number;
          cash_held?: number;
          created_at?: string;
          discount?: number;
          id?: string;
          item_type?: string;
          note?: string | null;
          percentage?: number;
          period_id?: string;
          total?: number;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "project_percentage_period_items_period_id_fkey";
            columns: ["period_id"];
            isOneToOne: false;
            referencedRelation: "project_percentage_periods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_percentage_period_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
      };
      project_percentage_periods: {
        Row: {
          created_at: string;
          created_by: string;
          end_date: string;
          id: string;
          project_id: string;
          start_date: string;
          total_amount: number;
          type: Database["public"]["Enums"]["payment_type"];
        };
        Insert: {
          created_at?: string;
          created_by: string;
          end_date: string;
          id?: string;
          project_id: string;
          start_date: string;
          total_amount: number;
          type: Database["public"]["Enums"]["payment_type"];
        };
        Update: {
          created_at?: string;
          created_by?: string;
          end_date?: string;
          id?: string;
          project_id?: string;
          start_date?: string;
          total_amount?: number;
          type?: Database["public"]["Enums"]["payment_type"];
        };
        Relationships: [
          {
            foreignKeyName: "project_percentage_periods_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_percentage_periods_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_refund: {
        Row: {
          amount: number;
          created_at: string;
          created_by: string;
          currency: Database["public"]["Enums"]["currency_type"];
          description: string | null;
          id: string;
          income_date: string;
          payment_method: Database["public"]["Enums"]["payment_type"];
          project_id: string;
          serial_number: number;
          updated_at: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          created_by: string;
          currency: Database["public"]["Enums"]["currency_type"];
          description?: string | null;
          id?: string;
          income_date?: string;
          payment_method: Database["public"]["Enums"]["payment_type"];
          project_id: string;
          serial_number: number;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          created_by?: string;
          currency?: Database["public"]["Enums"]["currency_type"];
          description?: string | null;
          id?: string;
          income_date?: string;
          payment_method?: Database["public"]["Enums"]["payment_type"];
          project_id?: string;
          serial_number?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_refund_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_refund_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
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
          expense_counter: number;
          id: string;
          income_counter: number;
          invoice_counter: number;
          latitude: number | null;
          longitude: number | null;
          map_counter: number;
          name: string;
          refund_counter: number;
          serial_number: number | null;
          status: Database["public"]["Enums"]["project_status_enum"];
        };
        Insert: {
          address?: string | null;
          client_id: string;
          code: string;
          created_at?: string;
          description?: string | null;
          expense_counter?: number;
          id?: string;
          income_counter?: number;
          invoice_counter?: number;
          latitude?: number | null;
          longitude?: number | null;
          map_counter?: number;
          name: string;
          refund_counter?: number;
          serial_number?: number | null;
          status?: Database["public"]["Enums"]["project_status_enum"];
        };
        Update: {
          address?: string | null;
          client_id?: string;
          code?: string;
          created_at?: string;
          description?: string | null;
          expense_counter?: number;
          id?: string;
          income_counter?: number;
          invoice_counter?: number;
          latitude?: number | null;
          longitude?: number | null;
          map_counter?: number;
          name?: string;
          refund_counter?: number;
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
          code: string;
          id: string;
          name: string;
          number: number;
        };
        Insert: {
          code: string;
          id?: string;
          name: string;
          number?: number;
        };
        Update: {
          code?: string;
          id?: string;
          name?: string;
          number?: number;
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
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
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
          {
            foreignKeyName: "user_specializations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          change_password_at: string | null;
          created_at: string;
          dob: string | null;
          email: string;
          first_login: boolean;
          first_name: string;
          id: string;
          last_name: string | null;
          phone: string | null;
          role_id: string;
          status: Database["public"]["Enums"]["user_status_enum"];
          updated_at: string | null;
        };
        Insert: {
          change_password_at?: string | null;
          created_at?: string;
          dob?: string | null;
          email: string;
          first_login?: boolean;
          first_name: string;
          id?: string;
          last_name?: string | null;
          phone?: string | null;
          role_id: string;
          status?: Database["public"]["Enums"]["user_status_enum"];
          updated_at?: string | null;
        };
        Update: {
          change_password_at?: string | null;
          created_at?: string;
          dob?: string | null;
          email?: string;
          first_login?: boolean;
          first_name?: string;
          id?: string;
          last_name?: string | null;
          phone?: string | null;
          role_id?: string;
          status?: Database["public"]["Enums"]["user_status_enum"];
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
      vendors: {
        Row: {
          address: string | null;
          alt_phone_number: string | null;
          city: string | null;
          contact_name: string | null;
          country: string | null;
          created_at: string;
          email: string | null;
          id: string;
          latitude: number | null;
          longitude: number | null;
          phone_number: string | null;
          specialization_id: string | null;
          updated_at: string;
          user_id: string | null;
          vendor_name: string;
        };
        Insert: {
          address?: string | null;
          alt_phone_number?: string | null;
          city?: string | null;
          contact_name?: string | null;
          country?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          phone_number?: string | null;
          specialization_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
          vendor_name: string;
        };
        Update: {
          address?: string | null;
          alt_phone_number?: string | null;
          city?: string | null;
          contact_name?: string | null;
          country?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          phone_number?: string | null;
          specialization_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
          vendor_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vendors_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_contract_payment: {
        Args: {
          p_approved_by: string;
          p_currency: string;
          p_payment_id: string;
          p_payment_method: string;
        };
        Returns: {
          account: Json;
          contract: Json;
          expense: Json;
          payment: Json;
          project: Json;
          project_balance: Json;
        }[];
      };
      accept_payroll_payment: {
        Args: {
          p_account_id: string;
          p_approved_by: string;
          p_payment_method: string;
          p_payroll_id: string;
        };
        Returns: {
          expense_id: string;
          message: string;
          payment_id: string;
          success: boolean;
        }[];
      };
      get_role_by_email: { Args: { p_email: string }; Returns: string };
      has_permission: {
        Args: { p_perm_name: string; p_user: string };
        Returns: boolean;
      };
      is_admin: { Args: never; Returns: boolean };
      process_expense_payment: {
        Args: {
          p_amount: number;
          p_created_by: string;
          p_currency: string;
          p_expense_id: string;
          p_payment_method: string;
          p_project_id: string;
        };
        Returns: {
          account: Json;
          expense: Json;
          payment: Json;
          payment_id: string;
          project: Json;
          project_balance: Json;
        }[];
      };
      reset_project_fresh: { Args: { p_project_id: string }; Returns: Json };
      rpc_add_project_expense:
        | {
            Args: {
              p_contractor_id?: string;
              p_created_by: string;
              p_currency: Database["public"]["Enums"]["currency_type"];
              p_description: string;
              p_expense_date: string;
              p_expense_id?: string;
              p_expense_type: Database["public"]["Enums"]["expense_type"];
              p_paid_amount?: number;
              p_payment_method?: Database["public"]["Enums"]["payment_method"];
              p_phase: Database["public"]["Enums"]["phase_type"];
              p_project_id: string;
              p_total_amount: number;
            };
            Returns: {
              amount_paid: number;
              contract_id: string | null;
              contractor_id: string | null;
              created_at: string;
              created_by: string;
              deleted_at: string | null;
              deleted_by: string | null;
              description: string | null;
              Discounting: number | null;
              expense_date: string;
              expense_id: string | null;
              expense_type: Database["public"]["Enums"]["expense_type"];
              id: string;
              is_edited: boolean | null;
              is_percentage: boolean | null;
              payment_counter: number;
              phase: Database["public"]["Enums"]["phase_type"];
              project_id: string;
              serial_number: number | null;
              status: Database["public"]["Enums"]["expense_status"] | null;
              total_amount: number;
              updated_at: string;
              vendor_id: string | null;
            };
            SetofOptions: {
              from: "*";
              to: "project_expenses";
              isOneToOne: true;
              isSetofReturn: false;
            };
          }
        | {
            Args: {
              p_contractor_id?: string;
              p_created_by: string;
              p_currency: Database["public"]["Enums"]["currency_type"];
              p_description: string;
              p_expense_date: string;
              p_expense_id?: string;
              p_expense_type: Database["public"]["Enums"]["expense_type"];
              p_paid_amount?: number;
              p_payment_method?: Database["public"]["Enums"]["payment_method"];
              p_phase: Database["public"]["Enums"]["phase_type"];
              p_project_id: string;
              p_total_amount: number;
              p_vendor_id?: string;
            };
            Returns: {
              amount_paid: number;
              contract_id: string | null;
              contractor_id: string | null;
              created_at: string;
              created_by: string;
              deleted_at: string | null;
              deleted_by: string | null;
              description: string | null;
              Discounting: number | null;
              expense_date: string;
              expense_id: string | null;
              expense_type: Database["public"]["Enums"]["expense_type"];
              id: string;
              is_edited: boolean | null;
              is_percentage: boolean | null;
              payment_counter: number;
              phase: Database["public"]["Enums"]["phase_type"];
              project_id: string;
              serial_number: number | null;
              status: Database["public"]["Enums"]["expense_status"] | null;
              total_amount: number;
              updated_at: string;
              vendor_id: string | null;
            };
            SetofOptions: {
              from: "*";
              to: "project_expenses";
              isOneToOne: true;
              isSetofReturn: false;
            };
          };
      rpc_add_project_expense_percentage: {
        Args: {
          p_contractor_id?: string;
          p_created_by: string;
          p_currency: Database["public"]["Enums"]["currency_type"];
          p_description: string;
          p_expense_date: string;
          p_expense_id?: string;
          p_expense_type: Database["public"]["Enums"]["expense_type"];
          p_paid_amount?: number;
          p_payment_method?: Database["public"]["Enums"]["payment_method"];
          p_percentage?: number;
          p_phase: Database["public"]["Enums"]["phase_type"];
          p_project_id: string;
          p_total_amount: number;
          p_vendor_id?: string;
        };
        Returns: {
          amount_paid: number;
          contract_id: string | null;
          contractor_id: string | null;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          Discounting: number | null;
          expense_date: string;
          expense_id: string | null;
          expense_type: Database["public"]["Enums"]["expense_type"];
          id: string;
          is_edited: boolean | null;
          is_percentage: boolean | null;
          payment_counter: number;
          phase: Database["public"]["Enums"]["phase_type"];
          project_id: string;
          serial_number: number | null;
          status: Database["public"]["Enums"]["expense_status"] | null;
          total_amount: number;
          updated_at: string;
          vendor_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "project_expenses";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      rpc_delete_expense_payment: {
        Args: { p_deleted_by: string; p_payment_id: string };
        Returns: Json;
      };
      rpc_process_expense_payment: {
        Args: {
          p_amount: number;
          p_created_by: string;
          p_currency: Database["public"]["Enums"]["currency_type"];
          p_expense_id: string;
          p_payment_method: Database["public"]["Enums"]["payment_method"];
          p_project_id: string;
        };
        Returns: {
          amount_paid: number;
          contract_id: string | null;
          contractor_id: string | null;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          Discounting: number | null;
          expense_date: string;
          expense_id: string | null;
          expense_type: Database["public"]["Enums"]["expense_type"];
          id: string;
          is_edited: boolean | null;
          is_percentage: boolean | null;
          payment_counter: number;
          phase: Database["public"]["Enums"]["phase_type"];
          project_id: string;
          serial_number: number | null;
          status: Database["public"]["Enums"]["expense_status"] | null;
          total_amount: number;
          updated_at: string;
          vendor_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "project_expenses";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      rpc_process_expense_payment_percentage: {
        Args: {
          p_amount: number;
          p_created_by: string;
          p_currency: Database["public"]["Enums"]["currency_type"];
          p_expense_id: string;
          p_payment_method: Database["public"]["Enums"]["payment_method"];
          p_percentage: number;
          p_project_id: string;
        };
        Returns: {
          amount_paid: number;
          contract_id: string | null;
          contractor_id: string | null;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          Discounting: number | null;
          expense_date: string;
          expense_id: string | null;
          expense_type: Database["public"]["Enums"]["expense_type"];
          id: string;
          is_edited: boolean | null;
          is_percentage: boolean | null;
          payment_counter: number;
          phase: Database["public"]["Enums"]["phase_type"];
          project_id: string;
          serial_number: number | null;
          status: Database["public"]["Enums"]["expense_status"] | null;
          total_amount: number;
          updated_at: string;
          vendor_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "project_expenses";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      rpc_soft_delete_project_expense: {
        Args: {
          p_currency: Database["public"]["Enums"]["currency_type"];
          p_deleted_by: string;
          p_expense_id: string;
        };
        Returns: Json;
      };
      rpc_update_expense_payment: {
        Args: {
          p_new_account_id: string;
          p_new_amount: number;
          p_payment_id: string;
          p_updated_by: string;
        };
        Returns: Json;
      };
      rpc_update_project_expense: {
        Args: {
          p_contractor_id?: string;
          p_currency: Database["public"]["Enums"]["currency_type"];
          p_description: string;
          p_expense_date: string;
          p_expense_id: string;
          p_expense_ref_id?: string;
          p_expense_type: Database["public"]["Enums"]["expense_type"];
          p_phase: Database["public"]["Enums"]["phase_type"];
          p_total_amount: number;
          p_updated_by?: string;
        };
        Returns: {
          amount_paid: number;
          contract_id: string | null;
          contractor_id: string | null;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          Discounting: number | null;
          expense_date: string;
          expense_id: string | null;
          expense_type: Database["public"]["Enums"]["expense_type"];
          id: string;
          is_edited: boolean | null;
          is_percentage: boolean | null;
          payment_counter: number;
          phase: Database["public"]["Enums"]["phase_type"];
          project_id: string;
          serial_number: number | null;
          status: Database["public"]["Enums"]["expense_status"] | null;
          total_amount: number;
          updated_at: string;
          vendor_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "project_expenses";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      account_type: "cash" | "bank";
      approval_type: "technical" | "finance";
      contractor_mode: "open" | "direct";
      currency_type: "LYD" | "USD" | "EUR";
      employee_type: "intern" | "contractor" | "part-time" | "full-time";
      expense_status:
        | "pending"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "cancelled"
        | "unpaid"
        | "deleted";
      expense_type: "material" | "labor" | "maps";
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
      payment_method: "cash" | "bank";
      payment_type: "cash" | "cheque" | "transfer" | "deposit" | "bank";
      phase_type: "construction" | "finishing" | "initial";
      project_status_enum: "active" | "paused" | "completed" | "cancelled";
      projects_type: "construction" | "consulting";
      transaction_type: "debit" | "credit";
      user_status_enum: "active" | "inactive" | "on leave" | "on holiday";
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
      employee_type: ["intern", "contractor", "part-time", "full-time"],
      expense_status: [
        "pending",
        "partially_paid",
        "paid",
        "overdue",
        "cancelled",
        "unpaid",
        "deleted",
      ],
      expense_type: ["material", "labor", "maps"],
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
      payment_method: ["cash", "bank"],
      payment_type: ["cash", "cheque", "transfer", "deposit", "bank"],
      phase_type: ["construction", "finishing", "initial"],
      project_status_enum: ["active", "paused", "completed", "cancelled"],
      projects_type: ["construction", "consulting"],
      transaction_type: ["debit", "credit"],
      user_status_enum: ["active", "inactive", "on leave", "on holiday"],
    },
  },
} as const;
