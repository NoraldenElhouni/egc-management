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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number
          currency: Database["public"]["Enums"]["currency_type"]
          id: string
          maps: number
          owner_id: string
          owner_type: Database["public"]["Enums"]["owner_type"]
          refund: number
          total_expense: number
          total_percentage: number
          total_transactions: number
          type: Database["public"]["Enums"]["account_type"]
        }
        Insert: {
          balance?: number
          currency: Database["public"]["Enums"]["currency_type"]
          id?: string
          maps?: number
          owner_id: string
          owner_type: Database["public"]["Enums"]["owner_type"]
          refund?: number
          total_expense?: number
          total_percentage?: number
          total_transactions?: number
          type: Database["public"]["Enums"]["account_type"]
        }
        Update: {
          balance?: number
          currency?: Database["public"]["Enums"]["currency_type"]
          id?: string
          maps?: number
          owner_id?: string
          owner_type?: Database["public"]["Enums"]["owner_type"]
          refund?: number
          total_expense?: number
          total_percentage?: number
          total_transactions?: number
          type?: Database["public"]["Enums"]["account_type"]
        }
        Relationships: [
          {
            foreignKeyName: "accounts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          file_name: string | null
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          title: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          file_name?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          title: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_name?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          title?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_negotiation_items: {
        Row: {
          id: string
          negotiation_id: string
          original_price: number
          proposed_price: number
          quantity: number
          request_item_id: string
          total_price: number
        }
        Insert: {
          id?: string
          negotiation_id: string
          original_price: number
          proposed_price: number
          quantity: number
          request_item_id: string
          total_price: number
        }
        Update: {
          id?: string
          negotiation_id?: string
          original_price?: number
          proposed_price?: number
          quantity?: number
          request_item_id?: string
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bid_negotiation_items_negotiation_fkey"
            columns: ["negotiation_id"]
            isOneToOne: false
            referencedRelation: "bid_negotiations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_negotiation_items_request_item_fkey"
            columns: ["request_item_id"]
            isOneToOne: false
            referencedRelation: "work_request_items"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_negotiations: {
        Row: {
          bid_id: string
          created_at: string
          expires_at: string
          id: string
          initiated_by: string
          initiated_role: Database["public"]["Enums"]["negotiation_initiated_by"]
          note: string | null
          proposed_days: number
          proposed_total: number
          request_id: string
          responded_at: string | null
          responded_by: string | null
          round: number
          status: Database["public"]["Enums"]["negotiation_status"]
        }
        Insert: {
          bid_id: string
          created_at?: string
          expires_at?: string
          id?: string
          initiated_by: string
          initiated_role: Database["public"]["Enums"]["negotiation_initiated_by"]
          note?: string | null
          proposed_days: number
          proposed_total: number
          request_id: string
          responded_at?: string | null
          responded_by?: string | null
          round?: number
          status?: Database["public"]["Enums"]["negotiation_status"]
        }
        Update: {
          bid_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          initiated_by?: string
          initiated_role?: Database["public"]["Enums"]["negotiation_initiated_by"]
          note?: string | null
          proposed_days?: number
          proposed_total?: number
          request_id?: string
          responded_at?: string | null
          responded_by?: string | null
          round?: number
          status?: Database["public"]["Enums"]["negotiation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "bid_negotiations_bid_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "contractor_bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_negotiations_initiated_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_negotiations_request_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "work_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_negotiations_responded_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          code: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string | null
          phone_number: string
          user_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name?: string | null
          phone_number: string
          user_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string | null
          phone_number?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      company: {
        Row: {
          created_at: string
          id: string
          name: string
          projects_counter: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          projects_counter?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          projects_counter?: number
        }
        Relationships: []
      }
      company_account: {
        Row: {
          bank_balance: number
          cash_balance: number
          created_at: string
          id: string
          status: string
          type: string
        }
        Insert: {
          bank_balance?: number
          cash_balance?: number
          created_at?: string
          id?: string
          status?: string
          type: string
        }
        Update: {
          bank_balance?: number
          cash_balance?: number
          created_at?: string
          id?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
      company_discounts: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string
          period_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          note: string
          period_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string
          period_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_discounts_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "project_percentage_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      company_expense: {
        Row: {
          amount: number
          amount_paid: number
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          serial_number: string | null
          status: Database["public"]["Enums"]["expense_status"] | null
          type: string
        }
        Insert: {
          amount: number
          amount_paid?: number
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          serial_number?: string | null
          status?: Database["public"]["Enums"]["expense_status"] | null
          type: string
        }
        Update: {
          amount?: number
          amount_paid?: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          serial_number?: string | null
          status?: Database["public"]["Enums"]["expense_status"] | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_expense_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      company_expense_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          date: string | null
          expense_id: string
          id: string
          payment_method: Database["public"]["Enums"]["account_type"]
          serial_number: number
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          date?: string | null
          expense_id: string
          id?: string
          payment_method: Database["public"]["Enums"]["account_type"]
          serial_number: number
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          date?: string | null
          expense_id?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["account_type"]
          serial_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_expense_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_expense_payments_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "company_expense"
            referencedColumns: ["id"]
          },
        ]
      }
      company_held: {
        Row: {
          amount: number
          created_at: string
          employee_id: string
          id: string
          note: string
          period_id: string
          type: Database["public"]["Enums"]["payment_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          employee_id: string
          id?: string
          note: string
          period_id: string
          type: Database["public"]["Enums"]["payment_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          employee_id?: string
          id?: string
          note?: string
          period_id?: string
          type?: Database["public"]["Enums"]["payment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "compan_ hed_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compan_ hed_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "project_percentage_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_milestones: {
        Row: {
          amount: number
          completed_at: string | null
          completed_by: string | null
          contract_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          order_index: number
          source_milestone_id: string | null
          status: Database["public"]["Enums"]["milestone_status"]
          title: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          completed_by?: string | null
          contract_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number
          source_milestone_id?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          title: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          completed_by?: string | null
          contract_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number
          source_milestone_id?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_milestones_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_milestones_contract_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_milestones_source_milestone_id_fkey"
            columns: ["source_milestone_id"]
            isOneToOne: false
            referencedRelation: "request_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_bid_items: {
        Row: {
          bid_id: string
          id: string
          notes: string | null
          quantity: number
          request_item_id: string
          total_price: number
          unit: string
          unit_price: number
        }
        Insert: {
          bid_id: string
          id?: string
          notes?: string | null
          quantity: number
          request_item_id: string
          total_price: number
          unit?: string
          unit_price: number
        }
        Update: {
          bid_id?: string
          id?: string
          notes?: string | null
          quantity?: number
          request_item_id?: string
          total_price?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "contractor_bid_items_bid_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "contractor_bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_bid_items_request_item_fkey"
            columns: ["request_item_id"]
            isOneToOne: false
            referencedRelation: "work_request_items"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_bids: {
        Row: {
          contractor_id: string
          days_needed: number
          final_days: number | null
          final_total: number | null
          id: string
          is_negotiating: boolean
          negotiation_round: number
          notes: string | null
          request_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["bid_status"]
          submitted_at: string
          total_price: number
        }
        Insert: {
          contractor_id: string
          days_needed: number
          final_days?: number | null
          final_total?: number | null
          id?: string
          is_negotiating?: boolean
          negotiation_round?: number
          notes?: string | null
          request_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["bid_status"]
          submitted_at?: string
          total_price: number
        }
        Update: {
          contractor_id?: string
          days_needed?: number
          final_days?: number | null
          final_total?: number | null
          id?: string
          is_negotiating?: boolean
          negotiation_round?: number
          notes?: string | null
          request_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["bid_status"]
          submitted_at?: string
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "contractor_bids_contractor_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_bids_request_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "work_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_bids_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string | null
          phone_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          contractor_id: string
          created_at: string
          created_by: string
          days_allocated: number
          end_date: string | null
          expense_id: string | null
          id: string
          notes: string | null
          project_id: string
          request_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"]
          total_amount: number
          updated_at: string
          winning_bid_id: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          created_by: string
          days_allocated: number
          end_date?: string | null
          expense_id?: string | null
          id?: string
          notes?: string | null
          project_id: string
          request_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          total_amount: number
          updated_at?: string
          winning_bid_id: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          created_by?: string
          days_allocated?: number
          end_date?: string | null
          expense_id?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          request_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          total_amount?: number
          updated_at?: string
          winning_bid_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_bid_fkey"
            columns: ["winning_bid_id"]
            isOneToOne: true
            referencedRelation: "contractor_bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_contractor_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "project_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_request_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "work_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_account: {
        Row: {
          bank_balance: number
          bank_held: number
          cash_balance: number
          cash_held: number
          created_at: string
          id: string
          loan_debt: number
          status: string
        }
        Insert: {
          bank_balance?: number
          bank_held?: number
          cash_balance?: number
          cash_held?: number
          created_at?: string
          id?: string
          loan_debt?: number
          status?: string
        }
        Update: {
          bank_balance?: number
          bank_held?: number
          cash_balance?: number
          cash_held?: number
          created_at?: string
          id?: string
          loan_debt?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "emplyee_accounts_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_certifications: {
        Row: {
          certification: string
          created_at: string
          employee_id: string
          id: string
        }
        Insert: {
          certification: string
          created_at?: string
          employee_id: string
          id?: string
        }
        Update: {
          certification?: string
          created_at?: string
          employee_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_certifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          created_at: string
          doc_type: string
          employee_id: string
          id: string
          uploaded_by: string | null
          url: string | null
        }
        Insert: {
          created_at?: string
          doc_type: string
          employee_id: string
          id?: string
          uploaded_by?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string
          doc_type?: string
          employee_id?: string
          id?: string
          uploaded_by?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          alternate_phone: string | null
          bank_account_number: string | null
          bank_name: string | null
          base_salary: number
          blood_type: string | null
          created_at: string
          date_of_joining: string | null
          dob: string | null
          email: string
          emergency_contact: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          employee_id: string
          employee_type: Database["public"]["Enums"]["employee_type"] | null
          first_name: string
          gender: string | null
          gpa: number | null
          graduation_year: number | null
          highest_qualification: string | null
          id: string
          id_proof_url: string | null
          last_name: string | null
          manager_id: string | null
          nationality: string | null
          personal_email: string | null
          personal_photo_url: string | null
          phone_number: string
          place_of_birth: string | null
          resume_url: string | null
          salary_type: string | null
          specializations_id: string | null
          status: string | null
          university: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          alternate_phone?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          base_salary?: number
          blood_type?: string | null
          created_at?: string
          date_of_joining?: string | null
          dob?: string | null
          email: string
          emergency_contact?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          employee_id: string
          employee_type?: Database["public"]["Enums"]["employee_type"] | null
          first_name: string
          gender?: string | null
          gpa?: number | null
          graduation_year?: number | null
          highest_qualification?: string | null
          id?: string
          id_proof_url?: string | null
          last_name?: string | null
          manager_id?: string | null
          nationality?: string | null
          personal_email?: string | null
          personal_photo_url?: string | null
          phone_number: string
          place_of_birth?: string | null
          resume_url?: string | null
          salary_type?: string | null
          specializations_id?: string | null
          status?: string | null
          university?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          alternate_phone?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          base_salary?: number
          blood_type?: string | null
          created_at?: string
          date_of_joining?: string | null
          dob?: string | null
          email?: string
          emergency_contact?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          employee_id?: string
          employee_type?: Database["public"]["Enums"]["employee_type"] | null
          first_name?: string
          gender?: string | null
          gpa?: number | null
          graduation_year?: number | null
          highest_qualification?: string | null
          id?: string
          id_proof_url?: string | null
          last_name?: string | null
          manager_id?: string | null
          nationality?: string | null
          personal_email?: string | null
          personal_photo_url?: string | null
          phone_number?: string
          place_of_birth?: string | null
          resume_url?: string | null
          salary_type?: string | null
          specializations_id?: string | null
          status?: string | null
          university?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_specializations_id_fkey"
            columns: ["specializations_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_payments: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          created_by: string | null
          expense_id: string
          expense_no: number | null
          id: string
          invoice_no: number | null
          payment_method: Database["public"]["Enums"]["account_type"] | null
          payment_no: number | null
          serial_number: number | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string
          created_by?: string | null
          expense_id: string
          expense_no?: number | null
          id?: string
          invoice_no?: number | null
          payment_method?: Database["public"]["Enums"]["account_type"] | null
          payment_no?: number | null
          serial_number?: number | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          created_by?: string | null
          expense_id?: string
          expense_no?: number | null
          id?: string
          invoice_no?: number | null
          payment_method?: Database["public"]["Enums"]["account_type"] | null
          payment_no?: number | null
          serial_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_payments_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "project_expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          created_at: string
          id: string
          name: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          usage_count?: number
        }
        Relationships: []
      }
      map_types: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      milestone_reports: {
        Row: {
          amount_done: number | null
          contract_id: string
          created_at: string
          description: string | null
          id: string
          img_path: string | null
          milestone_id: string
          submitted_by: string
        }
        Insert: {
          amount_done?: number | null
          contract_id: string
          created_at?: string
          description?: string | null
          id?: string
          img_path?: string | null
          milestone_id: string
          submitted_by: string
        }
        Update: {
          amount_done?: number | null
          contract_id?: string
          created_at?: string
          description?: string | null
          id?: string
          img_path?: string | null
          milestone_id?: string
          submitted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_reports_contract_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_reports_milestone_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "contract_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_reports_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          amount: number
          contract_id: string
          contractor_id: string
          created_at: string
          decline_at: string | null
          decline_reason: string | null
          description: string | null
          expense_id: string | null
          id: string
          milestone_id: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          project_id: string
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["payment_request_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          contract_id: string
          contractor_id: string
          created_at?: string
          decline_at?: string | null
          decline_reason?: string | null
          description?: string | null
          expense_id?: string | null
          id?: string
          milestone_id: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          project_id: string
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_request_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          contract_id?: string
          contractor_id?: string
          created_at?: string
          decline_at?: string | null
          decline_reason?: string | null
          description?: string | null
          expense_id?: string | null
          id?: string
          milestone_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          project_id?: string
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_contract_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_contractor_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_expense_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "project_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_milestone_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "contract_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_project_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bank_amount: number
          basic_salary: number | null
          cash_amount: number
          created_at: string
          created_by: string | null
          employee_id: string
          id: string
          pay_date: string
          percentage_salary: number | null
          project_id: string | null
          status: string
          total_salary: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bank_amount?: number
          basic_salary?: number | null
          cash_amount?: number
          created_at?: string
          created_by?: string | null
          employee_id: string
          id?: string
          pay_date: string
          percentage_salary?: number | null
          project_id?: string | null
          status?: string
          total_salary?: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bank_amount?: number
          basic_salary?: number | null
          cash_amount?: number
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          pay_date?: string
          percentage_salary?: number | null
          project_id?: string | null
          status?: string
          total_salary?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      project_assignments: {
        Row: {
          assigned_at: string
          id: string
          percentage: number
          project_id: string
          project_role_id: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          percentage?: number
          project_id: string
          project_role_id?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          percentage?: number
          project_id?: string
          project_role_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignments_project_role_id_fkey"
            columns: ["project_role_id"]
            isOneToOne: false
            referencedRelation: "project_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      project_balances: {
        Row: {
          balance: number
          currency: Database["public"]["Enums"]["currency_type"]
          id: string
          maps: number
          project_id: string
          refund: number
          total_expense: number
          total_percentage: number
          total_transactions: number
        }
        Insert: {
          balance?: number
          currency: Database["public"]["Enums"]["currency_type"]
          id?: string
          maps?: number
          project_id: string
          refund?: number
          total_expense?: number
          total_percentage?: number
          total_transactions?: number
        }
        Update: {
          balance?: number
          currency?: Database["public"]["Enums"]["currency_type"]
          id?: string
          maps?: number
          project_id?: string
          refund?: number
          total_expense?: number
          total_percentage?: number
          total_transactions?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_balances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_expenses: {
        Row: {
          amount_paid: number
          contractor_id: string | null
          created_at: string
          created_by: string
          currency: Database["public"]["Enums"]["currency_type"]
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          discounting: number | null
          expense_date: string
          expense_id: string | null
          expense_type: Database["public"]["Enums"]["expense_type"]
          id: string
          is_edited: boolean | null
          is_percentage: boolean | null
          payment_counter: number
          phase: Database["public"]["Enums"]["phase_type"]
          project_id: string
          serial_number: number | null
          status: Database["public"]["Enums"]["expense_status"] | null
          total_amount: number
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          amount_paid?: number
          contractor_id?: string | null
          created_at?: string
          created_by: string
          currency: Database["public"]["Enums"]["currency_type"]
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          discounting?: number | null
          expense_date?: string
          expense_id?: string | null
          expense_type: Database["public"]["Enums"]["expense_type"]
          id?: string
          is_edited?: boolean | null
          is_percentage?: boolean | null
          payment_counter?: number
          phase: Database["public"]["Enums"]["phase_type"]
          project_id: string
          serial_number?: number | null
          status?: Database["public"]["Enums"]["expense_status"] | null
          total_amount: number
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          amount_paid?: number
          contractor_id?: string | null
          created_at?: string
          created_by?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          discounting?: number | null
          expense_date?: string
          expense_id?: string | null
          expense_type?: Database["public"]["Enums"]["expense_type"]
          id?: string
          is_edited?: boolean | null
          is_percentage?: boolean | null
          payment_counter?: number
          phase?: Database["public"]["Enums"]["phase_type"]
          project_id?: string
          serial_number?: number | null
          status?: Database["public"]["Enums"]["expense_status"] | null
          total_amount?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_expenses_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_expenses_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_expenses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      project_incomes: {
        Row: {
          amount: number
          client_name: string | null
          created_at: string
          created_by: string
          currency: Database["public"]["Enums"]["currency_type"] | null
          description: string | null
          fund: Database["public"]["Enums"]["fund_type"]
          id: string
          income_date: string
          payment_method: Database["public"]["Enums"]["account_type"]
          project_id: string
          related_expense: string | null
          serial_number: number
          updated_at: string
        }
        Insert: {
          amount: number
          client_name?: string | null
          created_at?: string
          created_by: string
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description?: string | null
          fund: Database["public"]["Enums"]["fund_type"]
          id?: string
          income_date?: string
          payment_method: Database["public"]["Enums"]["account_type"]
          project_id: string
          related_expense?: string | null
          serial_number: number
          updated_at?: string
        }
        Update: {
          amount?: number
          client_name?: string | null
          created_at?: string
          created_by?: string
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description?: string | null
          fund?: Database["public"]["Enums"]["fund_type"]
          id?: string
          income_date?: string
          payment_method?: Database["public"]["Enums"]["account_type"]
          project_id?: string
          related_expense?: string | null
          serial_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_incomes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_incomes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_incomes_related_expense_fkey"
            columns: ["related_expense"]
            isOneToOne: false
            referencedRelation: "project_expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      project_maps: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          date: string
          description: string
          id: string
          invoice_number: number | null
          map_id: string
          payment_method: Database["public"]["Enums"]["account_type"] | null
          project_id: string
          serial_number: number
          status: Database["public"]["Enums"]["expense_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          date: string
          description: string
          id?: string
          invoice_number?: number | null
          map_id: string
          payment_method?: Database["public"]["Enums"]["account_type"] | null
          project_id: string
          serial_number: number
          status?: Database["public"]["Enums"]["expense_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string
          id?: string
          invoice_number?: number | null
          map_id?: string
          payment_method?: Database["public"]["Enums"]["account_type"] | null
          project_id?: string
          serial_number?: number
          status?: Database["public"]["Enums"]["expense_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_maps_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_maps_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "map_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_maps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_percentage: {
        Row: {
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"] | null
          id: string
          percentage: number
          period_percentage: number
          period_start: string
          project_id: string
          total_percentage: number
          type: Database["public"]["Enums"]["account_type"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"] | null
          id?: string
          percentage?: number
          period_percentage?: number
          period_start: string
          project_id: string
          total_percentage?: number
          type?: Database["public"]["Enums"]["account_type"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"] | null
          id?: string
          percentage?: number
          period_percentage?: number
          period_start?: string
          project_id?: string
          total_percentage?: number
          type?: Database["public"]["Enums"]["account_type"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_percentage_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_percentage_logs: {
        Row: {
          amount: number
          created_at: string | null
          distributed: boolean
          expense_id: string | null
          id: string
          payment_id: string | null
          percentage: number
          project_id: string
          refund_id: string | null
          type: Database["public"]["Enums"]["percentage_log_type"]
        }
        Insert: {
          amount: number
          created_at?: string | null
          distributed?: boolean
          expense_id?: string | null
          id?: string
          payment_id?: string | null
          percentage: number
          project_id: string
          refund_id?: string | null
          type?: Database["public"]["Enums"]["percentage_log_type"]
        }
        Update: {
          amount?: number
          created_at?: string | null
          distributed?: boolean
          expense_id?: string | null
          id?: string
          payment_id?: string | null
          percentage?: number
          project_id?: string
          refund_id?: string | null
          type?: Database["public"]["Enums"]["percentage_log_type"]
        }
        Relationships: [
          {
            foreignKeyName: "project_percentage_logs_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "project_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_percentage_logs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "expense_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_percentage_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_percentage_logs_refund_id_fkey"
            columns: ["refund_id"]
            isOneToOne: false
            referencedRelation: "project_refund"
            referencedColumns: ["id"]
          },
        ]
      }
      project_percentage_period_items: {
        Row: {
          bank_amount: number
          bank_held: number
          cash_amount: number
          cash_held: number
          created_at: string
          discount: number
          id: string
          item_type: string
          note: string | null
          percentage: number
          period_id: string
          total: number
          user_id: string | null
        }
        Insert: {
          bank_amount: number
          bank_held: number
          cash_amount: number
          cash_held: number
          created_at?: string
          discount: number
          id?: string
          item_type: string
          note?: string | null
          percentage: number
          period_id: string
          total: number
          user_id?: string | null
        }
        Update: {
          bank_amount?: number
          bank_held?: number
          cash_amount?: number
          cash_held?: number
          created_at?: string
          discount?: number
          id?: string
          item_type?: string
          note?: string | null
          percentage?: number
          period_id?: string
          total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_percentage_period_items_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "project_percentage_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_percentage_period_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      project_percentage_periods: {
        Row: {
          bank_percentage: number
          company_percentage: number
          created_at: string
          created_by: string
          currency: Database["public"]["Enums"]["currency_type"] | null
          end_date: string
          id: string
          project_id: string
          reversal_note: string | null
          reversed_at: string | null
          reversed_by: string | null
          source_percentage_id: string | null
          start_date: string
          status: string
          total_amount: number
          type: Database["public"]["Enums"]["payment_type"]
        }
        Insert: {
          bank_percentage?: number
          company_percentage?: number
          created_at?: string
          created_by: string
          currency?: Database["public"]["Enums"]["currency_type"] | null
          end_date: string
          id?: string
          project_id: string
          reversal_note?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          source_percentage_id?: string | null
          start_date: string
          status?: string
          total_amount: number
          type: Database["public"]["Enums"]["payment_type"]
        }
        Update: {
          bank_percentage?: number
          company_percentage?: number
          created_at?: string
          created_by?: string
          currency?: Database["public"]["Enums"]["currency_type"] | null
          end_date?: string
          id?: string
          project_id?: string
          reversal_note?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          source_percentage_id?: string | null
          start_date?: string
          status?: string
          total_amount?: number
          type?: Database["public"]["Enums"]["payment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "project_percentage_periods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_percentage_periods_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_percentage_periods_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_percentage_periods_source_percentage_id_fkey"
            columns: ["source_percentage_id"]
            isOneToOne: false
            referencedRelation: "project_percentage"
            referencedColumns: ["id"]
          },
        ]
      }
      project_refund: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          currency: Database["public"]["Enums"]["currency_type"]
          description: string | null
          expense_id: string | null
          id: string
          income_date: string
          invoice_number: number | null
          payment_method: Database["public"]["Enums"]["account_type"]
          project_id: string
          serial_number: number
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          currency: Database["public"]["Enums"]["currency_type"]
          description?: string | null
          expense_id?: string | null
          id?: string
          income_date?: string
          invoice_number?: number | null
          payment_method: Database["public"]["Enums"]["account_type"]
          project_id: string
          serial_number: number
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          description?: string | null
          expense_id?: string | null
          id?: string
          income_date?: string
          invoice_number?: number | null
          payment_method?: Database["public"]["Enums"]["account_type"]
          project_id?: string
          serial_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_refund_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_refund_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_refund_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_roles: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      project_user_permissions: {
        Row: {
          allowed: boolean
          granted_at: string
          granted_by: string | null
          permission_id: string
          project_id: string
          user_id: string
        }
        Insert: {
          allowed?: boolean
          granted_at?: string
          granted_by?: string | null
          permission_id: string
          project_id: string
          user_id: string
        }
        Update: {
          allowed?: boolean
          granted_at?: string
          granted_by?: string | null
          permission_id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pup_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pup_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pup_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pup_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          client_id: string
          code: string
          created_at: string
          default_bank_percentage: number
          default_company_percentage: number
          description: string | null
          expense_counter: number
          id: string
          income_counter: number
          invoice_counter: number
          latitude: number | null
          longitude: number | null
          map_counter: number
          name: string
          refund_counter: number
          serial_number: number | null
          status: Database["public"]["Enums"]["project_status_enum"]
        }
        Insert: {
          address?: string | null
          client_id: string
          code: string
          created_at?: string
          default_bank_percentage?: number
          default_company_percentage?: number
          description?: string | null
          expense_counter?: number
          id?: string
          income_counter?: number
          invoice_counter?: number
          latitude?: number | null
          longitude?: number | null
          map_counter?: number
          name: string
          refund_counter?: number
          serial_number?: number | null
          status?: Database["public"]["Enums"]["project_status_enum"]
        }
        Update: {
          address?: string | null
          client_id?: string
          code?: string
          created_at?: string
          default_bank_percentage?: number
          default_company_percentage?: number
          description?: string | null
          expense_counter?: number
          id?: string
          income_counter?: number
          invoice_counter?: number
          latitude?: number | null
          longitude?: number | null
          map_counter?: number
          name?: string
          refund_counter?: number
          serial_number?: number | null
          status?: Database["public"]["Enums"]["project_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      request_milestones: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_index: number
          percentage: number
          request_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          percentage?: number
          request_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          percentage?: number
          request_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_milestones_request_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "work_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          id: string
          name: string
          number: number
        }
        Insert: {
          code: string
          id?: string
          name: string
          number?: number
        }
        Update: {
          code?: string
          id?: string
          name?: string
          number?: number
        }
        Relationships: []
      }
      services: {
        Row: {
          category_id: string | null
          id: string
          name: string
          specialization_id: string | null
          unit: string | null
        }
        Insert: {
          category_id?: string | null
          id?: string
          name: string
          specialization_id?: string | null
          unit?: string | null
        }
        Update: {
          category_id?: string | null
          id?: string
          name?: string
          specialization_id?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "specialization_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          notes: string | null
          product_size_id: string
          quantity: number
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          notes?: string | null
          product_size_id: string
          quantity?: number
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          product_size_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "shop_cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "shop_carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_cart_items_product_size_id_fkey"
            columns: ["product_size_id"]
            isOneToOne: false
            referencedRelation: "shop_product_sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_carts: {
        Row: {
          created_at: string
          created_by: string
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_carts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_carts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_categories: {
        Row: {
          created_at: string
          description: string | null
          division_id: string
          icon_path: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          division_id: string
          icon_path?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          division_id?: string
          icon_path?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_categories_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "shop_divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_divisions: {
        Row: {
          created_at: string
          icon_path: string | null
          id: string
          name: string
          specialization_id: string | null
        }
        Insert: {
          created_at?: string
          icon_path?: string | null
          id?: string
          name: string
          specialization_id?: string | null
        }
        Update: {
          created_at?: string
          icon_path?: string | null
          id?: string
          name?: string
          specialization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_divisions_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_order_items: {
        Row: {
          created_at: string
          id: string
          name: string | null
          notes: string | null
          order_id: string
          product_size_id: string | null
          quantity: number
          quoted_total: number | null
          quoted_unit_price: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          order_id: string
          product_size_id?: string | null
          quantity: number
          quoted_total?: number | null
          quoted_unit_price?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          order_id?: string
          product_size_id?: string | null
          quantity?: number
          quoted_total?: number | null
          quoted_unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_size_id_fkey"
            columns: ["product_size_id"]
            isOneToOne: false
            referencedRelation: "shop_product_sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_order_vendor_quote_items: {
        Row: {
          id: string
          notes: string | null
          order_item_id: string
          quantity: number
          quote_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          id?: string
          notes?: string | null
          order_item_id: string
          quantity: number
          quote_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          id?: string
          notes?: string | null
          order_item_id?: string
          quantity?: number
          quote_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "shop_order_vendor_quote_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "shop_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_order_vendor_quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "shop_order_vendor_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_order_vendor_quotes: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          notes: string | null
          order_id: string
          ref_number: string | null
          responded_at: string | null
          status: string
          total_price: number
          vendor_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          ref_number?: string | null
          responded_at?: string | null
          status?: string
          total_price?: number
          vendor_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          ref_number?: string | null
          responded_at?: string | null
          status?: string
          total_price?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_order_vendor_quotes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_order_vendor_quotes_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          arrived_at: string | null
          arrived_marked_by: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string
          expense_id: string | null
          id: string
          note: string | null
          project_id: string
          quoted_at: string | null
          rejected_at: string | null
          rejected_by: string | null
          specialization_id: string
          status: string
          total_price: number | null
          vendor_id: string | null
          vendor_ref: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          arrived_at?: string | null
          arrived_marked_by?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by: string
          expense_id?: string | null
          id?: string
          note?: string | null
          project_id: string
          quoted_at?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          specialization_id: string
          status?: string
          total_price?: number | null
          vendor_id?: string | null
          vendor_ref?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          arrived_at?: string | null
          arrived_marked_by?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string
          expense_id?: string | null
          id?: string
          note?: string | null
          project_id?: string
          quoted_at?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          specialization_id?: string
          status?: string
          total_price?: number | null
          vendor_id?: string | null
          vendor_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_orders_arrived_marked_by_fkey"
            columns: ["arrived_marked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_orders_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_orders_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "project_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_orders_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_orders_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_product_sizes: {
        Row: {
          created_at: string
          id: string
          image_path: string | null
          is_active: boolean
          name: string
          price: number
          product_id: string
          sku: string
          unit: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_path?: string | null
          is_active?: boolean
          name: string
          price?: number
          product_id: string
          sku: string
          unit: string
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string | null
          is_active?: boolean
          name?: string
          price?: number
          product_id?: string
          sku?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_product_sizes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_path: string | null
          is_active: boolean
          name: string
          subcategory_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          name: string
          subcategory_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          name?: string
          subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "shop_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_subcategories: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "shop_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      specialization_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          specialization_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          specialization_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          specialization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialization_categories_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
        ]
      }
      specialization_permissions: {
        Row: {
          permission_id: string
          specialization_id: string
        }
        Insert: {
          permission_id: string
          specialization_id: string
        }
        Update: {
          permission_id?: string
          specialization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialization_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialization_permissions_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
        ]
      }
      specializations: {
        Row: {
          id: string
          name: string
          role_id: string
        }
        Insert: {
          id?: string
          name: string
          role_id: string
        }
        Update: {
          id?: string
          name?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specializations_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      update: {
        Row: {
          created_at: string
          id: string
          is_must: boolean
          type: string
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_must?: boolean
          type: string
          version: string
        }
        Update: {
          created_at?: string
          id?: string
          is_must?: boolean
          type?: string
          version?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          allowed: boolean
          permission_id: string
          user_id: string
        }
        Insert: {
          allowed: boolean
          permission_id: string
          user_id: string
        }
        Update: {
          allowed?: boolean
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_push_tokens: {
        Row: {
          created_at: string | null
          id: string
          push_token: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          push_token?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          push_token?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role_id: string
          user_id: string
        }
        Insert: {
          role_id: string
          user_id: string
        }
        Update: {
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_specializations: {
        Row: {
          specialization_id: string
          user_id: string
        }
        Insert: {
          specialization_id: string
          user_id: string
        }
        Update: {
          specialization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_specializations_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_specializations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          change_password_at: string | null
          created_at: string
          dob: string | null
          email: string
          first_login: boolean
          first_name: string
          id: string
          last_name: string | null
          phone: string | null
          role_id: string
          status: Database["public"]["Enums"]["user_status_enum"]
          updated_at: string | null
        }
        Insert: {
          change_password_at?: string | null
          created_at?: string
          dob?: string | null
          email: string
          first_login?: boolean
          first_name: string
          id?: string
          last_name?: string | null
          phone?: string | null
          role_id: string
          status?: Database["public"]["Enums"]["user_status_enum"]
          updated_at?: string | null
        }
        Update: {
          change_password_at?: string | null
          created_at?: string
          dob?: string | null
          email?: string
          first_login?: boolean
          first_name?: string
          id?: string
          last_name?: string | null
          phone?: string | null
          role_id?: string
          status?: Database["public"]["Enums"]["user_status_enum"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          alt_phone_number: string | null
          city: string | null
          contact_name: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          latitude: number | null
          longitude: number | null
          phone_number: string | null
          specialization_id: string | null
          updated_at: string
          user_id: string | null
          vendor_name: string
        }
        Insert: {
          address?: string | null
          alt_phone_number?: string | null
          city?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          phone_number?: string | null
          specialization_id?: string | null
          updated_at?: string
          user_id?: string | null
          vendor_name: string
        }
        Update: {
          address?: string | null
          alt_phone_number?: string | null
          city?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          phone_number?: string | null
          specialization_id?: string | null
          updated_at?: string
          user_id?: string | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      work_request_items: {
        Row: {
          created_at: string
          custom_name: string | null
          description: string | null
          id: string
          quantity: number
          request_id: string
          service_id: string | null
          unit: string
        }
        Insert: {
          created_at?: string
          custom_name?: string | null
          description?: string | null
          id?: string
          quantity: number
          request_id: string
          service_id?: string | null
          unit?: string
        }
        Update: {
          created_at?: string
          custom_name?: string | null
          description?: string | null
          id?: string
          quantity?: number
          request_id?: string
          service_id?: string | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_request_items_request_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "work_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_request_items_service_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      work_requests: {
        Row: {
          bid_deadline: string | null
          contact_name: string | null
          contact_phone: string | null
          contractor_provides_materials: boolean
          created_at: string
          created_by: string
          delay_penalty_terms: string | null
          description: string | null
          direct_contractor_id: string | null
          id: string
          mode: Database["public"]["Enums"]["work_request_mode"]
          project_id: string
          retention_terms: string | null
          specialization_id: string
          status: Database["public"]["Enums"]["work_request_status"]
          title: string
          updated_at: string
          work_start_at: string | null
        }
        Insert: {
          bid_deadline?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contractor_provides_materials?: boolean
          created_at?: string
          created_by: string
          delay_penalty_terms?: string | null
          description?: string | null
          direct_contractor_id?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["work_request_mode"]
          project_id: string
          retention_terms?: string | null
          specialization_id: string
          status?: Database["public"]["Enums"]["work_request_status"]
          title: string
          updated_at?: string
          work_start_at?: string | null
        }
        Update: {
          bid_deadline?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contractor_provides_materials?: boolean
          created_at?: string
          created_by?: string
          delay_penalty_terms?: string | null
          description?: string | null
          direct_contractor_id?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["work_request_mode"]
          project_id?: string
          retention_terms?: string | null
          specialization_id?: string
          status?: Database["public"]["Enums"]["work_request_status"]
          title?: string
          updated_at?: string
          work_start_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_requests_direct_contractor_fkey"
            columns: ["direct_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_requests_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_contract_payment: {
        Args: {
          p_approved_by: string
          p_currency: string
          p_payment_id: string
          p_payment_method: string
        }
        Returns: {
          account: Json
          contract: Json
          expense: Json
          payment: Json
          project: Json
          project_balance: Json
        }[]
      }
      accept_payroll_payment: {
        Args: {
          p_account_id: string
          p_approved_by: string
          p_payment_method: string
          p_payroll_id: string
        }
        Returns: {
          expense_id: string
          message: string
          payment_id: string
          success: boolean
        }[]
      }
      get_contractors_expenses: {
        Args: { p_project_id: string }
        Returns: {
          contractor_id: string
          first_name: string
          last_name: string
          latest_expense_date: string
          total_amount: number
        }[]
      }
      get_my_contractor_project_expenses: {
        Args: { p_contractor_id: string }
        Returns: {
          amount_paid: number
          not_paid: number
          project_code: string
          project_id: string
          project_name: string
          total_amount: number
        }[]
      }
      get_role_by_email: { Args: { p_email: string }; Returns: string }
      get_vendor_expenses: {
        Args: { p_project_id: string }
        Returns: {
          contact_name: string
          latest_expense_date: string
          total_amount: number
          vendor_id: string
          vendor_name: string
        }[]
      }
      has_permission: {
        Args: { p_perm_name: string; p_user: string }
        Returns: boolean
      }
      has_project_permission: {
        Args: { p_perm: string; p_project: string; p_user: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      map_payment_type_to_account_type: {
        Args: { p: Database["public"]["Enums"]["payment_type"] }
        Returns: Database["public"]["Enums"]["account_type"]
      }
      process_expense_payment: {
        Args: {
          p_amount: number
          p_created_by: string
          p_currency: string
          p_expense_id: string
          p_payment_method: string
          p_project_id: string
        }
        Returns: {
          account: Json
          expense: Json
          payment: Json
          payment_id: string
          project: Json
          project_balance: Json
        }[]
      }
      reset_project_fresh: { Args: { p_project_id: string }; Returns: Json }
      rpc_add_project_expense: {
        Args: {
          p_contractor_id?: string
          p_created_by: string
          p_currency: Database["public"]["Enums"]["currency_type"]
          p_description: string
          p_expense_date: string
          p_expense_id?: string
          p_expense_type: Database["public"]["Enums"]["expense_type"]
          p_paid_amount?: number
          p_payment_method?: Database["public"]["Enums"]["payment_method"]
          p_phase: Database["public"]["Enums"]["phase_type"]
          p_project_id: string
          p_total_amount: number
          p_vendor_id?: string
        }
        Returns: {
          amount_paid: number
          contractor_id: string | null
          created_at: string
          created_by: string
          currency: Database["public"]["Enums"]["currency_type"]
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          discounting: number | null
          expense_date: string
          expense_id: string | null
          expense_type: Database["public"]["Enums"]["expense_type"]
          id: string
          is_edited: boolean | null
          is_percentage: boolean | null
          payment_counter: number
          phase: Database["public"]["Enums"]["phase_type"]
          project_id: string
          serial_number: number | null
          status: Database["public"]["Enums"]["expense_status"] | null
          total_amount: number
          updated_at: string
          vendor_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "project_expenses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rpc_add_project_expense_percentage: {
        Args: {
          p_contractor_id?: string
          p_created_by: string
          p_currency: Database["public"]["Enums"]["currency_type"]
          p_description: string
          p_expense_date: string
          p_expense_id?: string
          p_expense_type: Database["public"]["Enums"]["expense_type"]
          p_paid_amount?: number
          p_payment_method?: Database["public"]["Enums"]["payment_method"]
          p_percentage?: number
          p_phase: Database["public"]["Enums"]["phase_type"]
          p_project_id: string
          p_total_amount: number
          p_vendor_id?: string
        }
        Returns: {
          amount_paid: number
          contractor_id: string | null
          created_at: string
          created_by: string
          currency: Database["public"]["Enums"]["currency_type"]
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          discounting: number | null
          expense_date: string
          expense_id: string | null
          expense_type: Database["public"]["Enums"]["expense_type"]
          id: string
          is_edited: boolean | null
          is_percentage: boolean | null
          payment_counter: number
          phase: Database["public"]["Enums"]["phase_type"]
          project_id: string
          serial_number: number | null
          status: Database["public"]["Enums"]["expense_status"] | null
          total_amount: number
          updated_at: string
          vendor_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "project_expenses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rpc_delete_expense_payment: {
        Args: { p_deleted_by: string; p_payment_id: string }
        Returns: Json
      }
      rpc_process_expense_payment: {
        Args: {
          p_amount: number
          p_created_by: string
          p_currency: Database["public"]["Enums"]["currency_type"]
          p_expense_id: string
          p_payment_method: Database["public"]["Enums"]["payment_method"]
          p_project_id: string
        }
        Returns: {
          amount_paid: number
          contractor_id: string | null
          created_at: string
          created_by: string
          currency: Database["public"]["Enums"]["currency_type"]
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          discounting: number | null
          expense_date: string
          expense_id: string | null
          expense_type: Database["public"]["Enums"]["expense_type"]
          id: string
          is_edited: boolean | null
          is_percentage: boolean | null
          payment_counter: number
          phase: Database["public"]["Enums"]["phase_type"]
          project_id: string
          serial_number: number | null
          status: Database["public"]["Enums"]["expense_status"] | null
          total_amount: number
          updated_at: string
          vendor_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "project_expenses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rpc_process_expense_payment_percentage: {
        Args: {
          p_amount: number
          p_created_by: string
          p_currency: Database["public"]["Enums"]["currency_type"]
          p_expense_id: string
          p_payment_method: Database["public"]["Enums"]["payment_method"]
          p_percentage: number
          p_project_id: string
        }
        Returns: {
          amount_paid: number
          contractor_id: string | null
          created_at: string
          created_by: string
          currency: Database["public"]["Enums"]["currency_type"]
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          discounting: number | null
          expense_date: string
          expense_id: string | null
          expense_type: Database["public"]["Enums"]["expense_type"]
          id: string
          is_edited: boolean | null
          is_percentage: boolean | null
          payment_counter: number
          phase: Database["public"]["Enums"]["phase_type"]
          project_id: string
          serial_number: number | null
          status: Database["public"]["Enums"]["expense_status"] | null
          total_amount: number
          updated_at: string
          vendor_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "project_expenses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rpc_soft_delete_project_expense: {
        Args: {
          p_currency: Database["public"]["Enums"]["currency_type"]
          p_deleted_by: string
          p_expense_id: string
        }
        Returns: Json
      }
      rpc_update_expense_payment: {
        Args: {
          p_new_account_id: string
          p_new_amount: number
          p_payment_id: string
          p_updated_by: string
        }
        Returns: Json
      }
      rpc_update_project_expense: {
        Args: {
          p_contractor_id?: string
          p_currency: Database["public"]["Enums"]["currency_type"]
          p_description: string
          p_expense_date: string
          p_expense_id: string
          p_expense_ref_id?: string
          p_expense_type: Database["public"]["Enums"]["expense_type"]
          p_phase: Database["public"]["Enums"]["phase_type"]
          p_total_amount: number
          p_updated_by?: string
        }
        Returns: {
          amount_paid: number
          contractor_id: string | null
          created_at: string
          created_by: string
          currency: Database["public"]["Enums"]["currency_type"]
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          discounting: number | null
          expense_date: string
          expense_id: string | null
          expense_type: Database["public"]["Enums"]["expense_type"]
          id: string
          is_edited: boolean | null
          is_percentage: boolean | null
          payment_counter: number
          phase: Database["public"]["Enums"]["phase_type"]
          project_id: string
          serial_number: number | null
          status: Database["public"]["Enums"]["expense_status"] | null
          total_amount: number
          updated_at: string
          vendor_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "project_expenses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      account_type: "cash" | "bank"
      bid_status: "pending" | "accepted" | "rejected" | "withdrawn"
      contract_status: "active" | "completed" | "terminated" | "on_hold"
      currency_type: "LYD" | "USD" | "EUR"
      employee_type: "intern" | "contractor" | "part-time" | "full-time"
      expense_status:
        | "pending"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "cancelled"
        | "unpaid"
        | "deleted"
      expense_type: "material" | "labor" | "maps"
      fund_type: "client" | "internal" | "sale" | "refund" | "other"
      milestone_status: "pending" | "in_progress" | "completed" | "approved"
      negotiation_initiated_by: "engineer" | "contractor"
      negotiation_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "countered"
        | "expired"
      owner_type: "employee" | "project" | "company" | "contractor"
      payment_method: "cash" | "bank"
      payment_request_status: "pending" | "approved" | "declined" | "paid"
      payment_type: "cash" | "cheque" | "transfer" | "deposit" | "bank"
      percentage_log_type: "expense" | "refund"
      phase_type: "construction" | "finishing" | "initial"
      project_status_enum: "active" | "paused" | "completed" | "cancelled"
      projects_type: "construction" | "consulting"
      transaction_type: "debit" | "credit"
      user_status_enum: "active" | "inactive" | "on leave" | "on holiday"
      work_request_mode: "open" | "direct"
      work_request_status:
        | "draft"
        | "open"
        | "bidding"
        | "awarded"
        | "cancelled"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["cash", "bank"],
      bid_status: ["pending", "accepted", "rejected", "withdrawn"],
      contract_status: ["active", "completed", "terminated", "on_hold"],
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
      milestone_status: ["pending", "in_progress", "completed", "approved"],
      negotiation_initiated_by: ["engineer", "contractor"],
      negotiation_status: [
        "pending",
        "accepted",
        "rejected",
        "countered",
        "expired",
      ],
      owner_type: ["employee", "project", "company", "contractor"],
      payment_method: ["cash", "bank"],
      payment_request_status: ["pending", "approved", "declined", "paid"],
      payment_type: ["cash", "cheque", "transfer", "deposit", "bank"],
      percentage_log_type: ["expense", "refund"],
      phase_type: ["construction", "finishing", "initial"],
      project_status_enum: ["active", "paused", "completed", "cancelled"],
      projects_type: ["construction", "consulting"],
      transaction_type: ["debit", "credit"],
      user_status_enum: ["active", "inactive", "on leave", "on holiday"],
      work_request_mode: ["open", "direct"],
      work_request_status: ["draft", "open", "bidding", "awarded", "cancelled"],
    },
  },
} as const
