<template>
  <div id="app">
    <h1>指令產生器</h1>
    <el-form ref="codeGen" :model="codeGen" label-position="top">
      <el-row>
        <el-col :xs="24" :sm="12">
          <el-form-item label="賣出前公會資金">
            <el-input-number class="money-input" size="small" :min="0" v-model ="codeGen.beforeCoin"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="賣出後公會資金">
            <el-input-number class="money-input" size="small" :min="0" v-model ="codeGen.afterCoin"></el-input-number>
            <el-button v-if="total>0" type="primary" size="medium" @click="calcAfterCoin()">一鍵計算</el-button>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="選擇戰利品">
        <el-checkbox-group v-model="codeGen.picked" size="mini">
          <el-checkbox-button
            v-for="(item, key) in itemRaw"
            :key="key" :label="item"><img
            :src="`src/assets/images/${item.src}`">
          </el-checkbox-button>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="戰利品列表">
        <el-table
          style="width: 100%"
          :data="codeGen.picked"
          :summary-method="summary"
          show-summary
          empty-text="請點選戰利品">
          <el-table-column prop="src" label="項目" min-width="160">
            <template slot-scope="scope">
              <img :src="`src/assets/images/${scope.row.src}`">
            </template>
          </el-table-column>
          <el-table-column prop="name" label="名稱" min-width="160"></el-table-column>
          <el-table-column prop="money" label="單價" min-width="120">
            <template slot-scope="scope">
              {{ scope.row.money | addComma}}
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="數量" min-width="200">
            <template slot-scope="scope">
              <el-input-number size="small" :min="0" v-model="scope.row.amount" @change="updateTotal(scope.row)"></el-input-number>
            </template>
          </el-table-column>
          <el-table-column prop="total" label="複價" min-width="120">
            <template slot-scope="scope">
              {{ scope.row.total | addComma}}
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
      <el-form-item label="是否組對">
        <el-switch
          v-model="codeGen.isParty"
          active-text="組對出海"
          inactive-text="單打獨鬥">
        </el-switch>
      </el-form-item>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" v-for="(member, index, key) in codeGen.partyMember" :key="key">
          <el-form-item :label="`隊員${index+1}`" v-if="codeGen.isParty">
            <el-input v-model="member.value" placeholder="請輸入隊員暱稱"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="金額核對">
        <p>輸入金額差額 / 戰利品換算金額：
          <span :class="[isValid ? 'valid' : 'invalid']">{{coinDelta | addComma}}/{{total | addComma}}</span>
          <span class="valid" v-if="isValid">（ 金額核對正確 ）</span>
          <span class="invalid" v-if="!isValid">（ 金額核對有誤，請檢查輸入金額 ）</span>
        </p>

      </el-form-item>
      <el-form-item label="產生指令代碼" v-if="isValid">
        <el-button type="primary" @click="generateCode()">產生代碼</el-button>
        <el-button type="primary" @click="reset('codeGen')">選項重設</el-button>
      </el-form-item>
      <el-form-item label="代碼" v-if="isValid">
        <pre class="code">
          <code class="for-copy">{{code}}</code>
        </pre>
        <el-button type="primary" size="mini" v-clipboard="code" @success="copySuccess">一鍵複製</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import itemData from './assets/data/items.json'
import utils from './utils/utils.js'

export default {
  name: 'app',
  mounted() {
    this.resetItemRaw()
  },
  data () {
    return {
      itemRaw: [],
      total: 0,
      codeGen: {
        beforeCoin: 0,
        afterCoin: 0,
        picked: [],
        isParty: false,
        partyMember: [
          {value: ''},
          {value: ''},
          {value: ''},
          {value: ''}
        ],
      },
      code: '',
    }
  },
  computed: {
    coinDelta () {
      return this.codeGen.afterCoin - this.codeGen.beforeCoin
    },
    isValid () {
      return this.coinDelta === this.total && this.total > 0
    }
  },
  filters: {
    addComma: utils.addComma
  },
  methods: {
    calcAfterCoin() {
      this.codeGen.afterCoin = this.codeGen.beforeCoin + this.total
    },
    updateTotal(item) {
      item.total = item.money * item.amount
    },
    summary (params) {
      const sum = []
      params.columns.forEach((column, index) => {
        switch (index) {
          case 0: sum[0] = '戰利品合計'; break;
          case 1: sum[1] = null; break;
          case 2: sum[2] = null; break;
          case 3: sum[3] = null; break;
          case 4: 
            this.total = params.data.reduce((cur, next) => {
              return cur = cur += next.total
            }, 0)
            sum[4] = utils.addComma(this.total); break;
        }
      })
      return sum
    },
    generateCode() {
      // prefix
      let code = `. ${this.codeGen.beforeCoin} ${this.codeGen.afterCoin} `
      // add party members
      if(this.codeGen.isParty) {
        let member = this.codeGen.partyMember
          .map(member => {
            if(member.value) return `@${member.value}`
          })
          .join(' ')
        code += (member.trim() + ' ')
      }
      // add item list (no yello)
      let items = this.codeGen.picked
        .filter(item => item.icon !== ':yello:')
        .map(item => {
          if(item.amount !== 0) {
            return `${item.icon} ${item.amount}`
          } else {
            return ''
          }
        })
        .join(' ')
        code += items
      // add item list (yello)
      let yelloAmount = this.codeGen.picked
        .filter(item => item.icon === ':yello:')
        .reduce((total, next) => {
          return total = total += next.amount
        }, 0)
      if(yelloAmount !== 0) {
        let yelloCode = `:yello: ${yelloAmount}`
        code = code + ' ' + yelloCode
      }
      this.code = code.trim()
    },
    reset () {
      this.total = 0
      this.codeGen.beforeCoin = 0
      this.codeGen.afterCoin = 0
      this.codeGen.picked = []
      this.codeGen.isParty = false
      this.codeGen.partyMember = [
        {value: ''},
        {value: ''},
        {value: ''},
        {value: ''}
      ]
      this.code = ''
      this.resetItemRaw()
    },
    resetItemRaw () {
      this.itemRaw = itemData.items.map(item => {
        item.amount = 0
        item.total = 0
        return item
      })
    },
    copySuccess () {
      this.$message({
        message: '代碼複製成功',
        type: 'success'
      });
    }
  }
}
</script>

<style lang="scss">
.money-input {
  min-width: 300px;
}
.valid {
  color: #67c23a;
}
.invalid {
  color: red;
}
.user-msg {
  margin: 0;
}
.code {
  color: #FFF;
  background: #232323;
  padding: 20px;
  code {
    font: normal 10pt Consolas, Monaco, monospace;
  }
  .copy-button {
    color: #FFF;
  }
}
</style>
